import {NextRequest, NextResponse} from 'next/server'
import { GoToHuman } from 'gotohuman'

export const runtime = "edge";

export async function POST(request:NextRequest) {
  GoToHuman.handleHumanResponse(await request.json(), {
    onHumanApproved: ({taskId, actionValues, config}) => {
      console.log(`onHumanApproved: customer email: ${actionValues.find((av)=>av.id === 'email').text} human answer: ${actionValues.find((av)=>av.id === 'answer').text}`);
    },
    onHumanRejected: ({taskId}) => {
      console.log(`onHumanRejected task ${taskId}`);
    }
  })
  return Response.json({ message: 'Thanks for sending the human feedback' })
}