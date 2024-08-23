import { NextRequest, NextResponse } from 'next/server'
import { GoToHuman, HumanResponse } from 'gotohuman';

export const runtime = "edge";

export async function POST(request:NextRequest) {
  GoToHuman.handleHumanResponse(await request.json(), {
    onHumanApproved(webhookResponse) {
      const { taskId, humanResponse } = webhookResponse
      humanResponse === HumanResponse.Approved
      console.log(`onHumanApproved: customer email: ${GoToHuman.getActionValueById('email', webhookResponse)?.text} human answer: ${GoToHuman.getActionValueById('answer', webhookResponse)?.text}`);
    },
    onHumanRejected(webhookResponse) {
      console.log(`onHumanRejected task ${webhookResponse.taskId || 'noTaskId'}`);
    },
  })
  return Response.json({ message: 'Thanks for sending the human feedback' })
}