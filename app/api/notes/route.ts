import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, getUserFromRequest, signToken } from '@/lib/auth';
import {prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    const notes = await prisma.note.findMany({ where: { tenantId: user.tenantId } });
    return NextResponse.json(notes);
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized or invalid request.' }), { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant) {
      return new NextResponse(JSON.stringify({ error: 'Invalid tenant' }), { status: 400 });
    }

    if (tenant.plan === 'FREE') {
      const count = await prisma.note.count({ where: { tenantId: tenant.id } });
      if (count >= 3) {
        return new NextResponse(JSON.stringify({ error: 'Free plan note limit reached' }), { status: 403 });
      }
    }

    const { title, content } = await request.json();
    if (!title || !content) {
      return new NextResponse(JSON.stringify({ error: 'Missing title or content' }), { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: user.tenantId,
        ownerId: user.id,
      },
    });

    return new NextResponse(JSON.stringify(note), { status: 201 });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized or invalid request.' }), { status: 401 });
  }
}