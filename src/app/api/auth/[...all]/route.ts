import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export async function GET(request: Request) {
  return auth.handler(request);
}

export async function POST(request: Request) {
  return auth.handler(request);
}
