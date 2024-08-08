import {NextRequest, NextResponse} from 'next/server'
import { GoToHuman } from 'gotohuman';

export const runtime = "edge";

export async function POST(request:NextRequest) {
  GoToHuman.handleHumanResponse(await request.json(), {
    onHumanApproved: (response: any) => {
      const { taskId, actionValues } = response as { taskId: string, actionValues: any[] };
      console.log(`onHumanApproved: customer email: ${actionValues.find((av)=>av.id === 'email').text} human answer: ${actionValues.find((av)=>av.id === 'answer').text}`);
    },
    onHumanRejected: (response: any) => {
      const { taskId } = response as { taskId: string };
      console.log(`onHumanRejected task ${taskId}`);
    }
  })
  return Response.json({ message: 'Thanks for sending the human feedback' })
}