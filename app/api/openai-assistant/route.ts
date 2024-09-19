import {NextRequest, NextResponse} from 'next/server'
import { createReadStream } from 'fs';
import OpenAI from 'openai'
import { GoToHuman } from 'gotohuman'

export async function POST(request:NextRequest) {
    const newMessage = await request.json();
    const openai = new OpenAI();

    if (newMessage.assistantId == null) {
      if (process.env.OPEN_AI_ASSISTANT_ID) { // To avoid creating a new assistant with every new chat session, you might want to provide a fixed ID (that you get from creating the assistant once from code (which we do to have a self-contained example), or in the OpenAI web UI)
        newMessage.assistantId = process.env.OPEN_AI_ASSISTANT_ID;
      } else {
        let vectorStore = await openai.beta.vectorStores.create({
          name: "Q&A List",
        });
        console.log("created vector store ", vectorStore.id)
        const readStream = createReadStream(process.cwd() + '/files/answers.json', 'utf8');
        const readStream2 = createReadStream(process.cwd() + '/files/kbase.md', 'utf8');
        await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {files: [readStream, readStream2]})
        console.log("uploadAndPoll done")
        const assistant = await openai.beta.assistants.create({
          model: "gpt-4o",
          instructions:
            "You are a helpful customer support agent for our car sharing service. You answer questions based on the files provided to you. If you can't answer a question, ask the user for an email address, forward the request to a human, and tell the user that someone will get back to them.",
          tool_resources: {
            "file_search": {
              "vector_store_ids": [vectorStore.id]
            }
          },
          tools: [
            { type: "file_search" },
            {
              type: "function",
              function: {
                name: "call_human",
                description: "Forward the customer request to a human supervisor to handle the case if I don't know the answer",
                strict: true, //Structured Outputs
                parameters: {
                  type: "object",
                  properties: {
                    email: {
                      type: "string",
                      description: "The email address of the user that a response will later be send to by a human"
                    },
                    conversation: {
                      type: "string",
                      description: "The part of the conversation with the customer that I can't answer"
                    }
                  },
                  additionalProperties: false,
                  required: [
                    "email",
                    "conversation"
                  ]
                }
              },
            },
          ],
        });
        console.log("created assistant " + assistant.id)
        newMessage.assistantId = assistant.id;
      }
    }

    if (newMessage.threadId == null) {
        const thread = await openai.beta.threads.create();
        newMessage.threadId = thread.id;
    }

    if (newMessage.isToolRequest) {
      const toolCalls = newMessage.toolCalls;
      const tool_outputs = await Promise.all(
        toolCalls.map(async (toolCall: any) => {
          const parameters = toolCall.args;
          switch (toolCall.name) {
            case "call_human": {
              const messages = (await openai.beta.threads.messages.list(newMessage.threadId)).data;
              const messagesWithRunSteps = await Promise.all(messages.map(async (msg) => {
                if (msg.run_id) {
                  const run = await openai.beta.threads.runs.retrieve(newMessage.threadId, msg.run_id);
                  const steps = (await openai.beta.threads.runs.steps.list(newMessage.threadId, run.id, {}, { query: { "include[]": "step_details.tool_calls[*].file_search.results[*].content" } })).data;
                  return { ...msg, run_obj: { ...run, step_objs: steps } };
                }
                return msg;
              }));
              const email = parameters.email
              const conversation = parameters.conversation
              try {
                const gotoHuman = new GoToHuman({apiKey: process.env.GOTOHUMAN_API_KEY, agentId: "com.gotohuman.demos.chatbot", agentRunId: newMessage.threadId, fetch: globalThis.fetch })
                await gotoHuman.requestHumanApproval({
                    taskId: "provideAnswer",
                    taskName: "Provide response",
                    taskDesc: conversation,
                    completedTasks: [{type: "openai_conversation", result: messagesWithRunSteps, taskName: "Customer Conversation"}],
                    actionValues: [{id: "email", label: "Customer Email", type: "text", text: email}, {id: "answer", label: "Your response", type: "text", text: ""}],
                  });
                return {
                  tool_call_id: toolCall.id,
                  output: `Request was successfully forwarded to a human`,
                };
              } catch (error) {
                return {
                  tool_call_id: toolCall.id,
                  output: `The request failed!`,
                };
              }
            }
            default: {
              return {
                tool_call_id: toolCall.id,
                output: `unknown function: ${toolCall.function.name}`,
              };
            }
          }
        })
      );

      const toolStream = openai.beta.threads.runs.submitToolOutputsStream(newMessage.threadId, newMessage.runId, {
        tool_outputs: tool_outputs,
      });
      return new Response(toolStream.toReadableStream());
    }

    // new user message, add to thread
    await openai.beta.threads.messages.create(
        newMessage.threadId,
        {
            role: "user",
            content: newMessage.content
        }
    );

    const stream = await openai.beta.threads.runs.stream(
        newMessage.threadId,
        {
          assistant_id: newMessage.assistantId,
          parallel_tool_calls: false,
        }
    );
    return new Response(stream.toReadableStream());
}