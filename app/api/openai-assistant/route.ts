import {NextRequest, NextResponse} from 'next/server'
import OpenAI from 'openai'
import { GoToHuman } from 'gotohuman'

export const runtime = "edge";

export async function POST(request:NextRequest) {
    const newMessage = await request.json();
    const openai = new OpenAI();

    if (newMessage.assistantId == null) {
      const assistant = await openai.beta.assistants.create({
        model: "gpt-4o",
        instructions:
          "You are a helpful customer support agent for our car sharing service. You only know that the price per km is 0,50€. If you can't answer a question, ask the user for an email address, forward the request to a human, and tell the user that someone will get back to them.",
        tools: [
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
      newMessage.assistantId = assistant.id;
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
              const email = parameters.email
              const conversation = parameters.conversation
              try {
                const gotoHuman = new GoToHuman({apiKey: process.env.GOTOHUMAN_API_KEY, agentId: "com.gotohuman.demos.chatbot", agentRunId: newMessage.threadId, fetch: globalThis.fetch })
                await gotoHuman.requestHumanApproval({
                    taskId: "provideAnswer",
                    taskName: "Provide response",
                    taskDesc: conversation,
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