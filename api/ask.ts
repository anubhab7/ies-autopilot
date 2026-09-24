import { handleAsk } from './_askCore';

/** Vercel function: GET /api/ask?health=1 and POST /api/ask {question}. The key never reaches the client. */
async function respond(request: Request): Promise<Response> {
  const result = await handleAsk(
    { method: request.method, url: request.url, body: request.method === 'POST' ? await request.text() : '' },
    process.env,
  );
  return Response.json(result.body, { status: result.status });
}

export const GET = respond;
export const POST = respond;
