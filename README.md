# OpenAI Assistants API <> gotoHuman

A NextJS demo chatbot
- using the OpenAI <b>Assistants API</b>
- using OpenAI's [<b>Structured Outputs</b>](https://platform.openai.com/docs/guides/structured-outputs/introduction) for reliable JSON schemas
- using [<b>gotoHuman</b>](https://gotohuman.com) to easily fallback to a human if the bot cannot answer a question

Any unanswered question gets sent to the human supervisor`s inbox at gotoHuman where the answer can be entered. This triggers a webhook (that you defined) so you can continue the workflow, e.g. to send an email to the customer.

Add your OpenAI API Key and your [gotoHuman API key](https://app.gotohuman.com) to `.env.local` or your Environment Variables:
```
OPENAI_API_KEY = sk-API_KEY_HERE
GOTOHUMAN_API_KEY = enterapikeyforgth
```

Run the app:
```
npm i
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the chatbot and [open gotoHuman](https://app.gotohuman.com) to see open cases that need human intervention.

![Chatbot -> gotoHuman: fallback to human](gth-chat-fallback.gif)