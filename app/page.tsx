import OpenAIAssistant from "@/app/ui/openai-assistant";


export default function Home() {
  return (
    <main>
      <div className="mx-auto mb-12 max-w-lg text-center">
        <div className="m-4">
          <h1 className="mb-4 text-5xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-5xl">gotoHuman<br/>{'<>'}<br/>OpenAI Assistant</h1>
          <div className="mb-6 text-sm font-normal text-gray-500">
            This is a demo to show how you can create a chatbot with the OpenAI Assistants API that uses gotoHuman as a fallback if it cannot answer a question. The case is then sent to the human supervisor`s inbox at gotoHuman where the answer can be entered and a webhook (that you defined) gets triggered to e.g. send an email to the customer.
            <br/><br/><i>Try: &apos;How much is a ride?&apos; and &apos;Can I drive abroad?&apos;</i>
          </div>
        </div>
        <OpenAIAssistant 
          greeting="I hope you enjoy our car sharing service. How may I help you?"
        />
      </div>
    </main>
  );
}
