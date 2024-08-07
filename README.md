# OpenAI Assistants API <> gotoHuman

This is a demo to show how you can create a chatbot with the OpenAI Assistants API that uses gotoHuman as a fallback if it cannot answer a question. The case is then sent to the human supervisor`s inbox at gotoHuman where the answer can be entered. This triggers a webhook (that you defined) so you can continue the workflow, e.g. send an email to the customer.

Add your OpenAI API Key and your [gotoHuman API key](https://app.gotohuman.com) to `.env.local` or your Environment Variables:
```
OPENAI_API_KEY = sk-API_KEY_HERE
GOTOHUMAN_API_KEY = enterapikeyforgth
```

Run the app:
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

![Chatbot -> gotoHuman: fallback to human](gth-chat-fallback.gif)