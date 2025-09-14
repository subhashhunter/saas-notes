import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUserFromRequest(request);
    const noteId = parseInt(params.id, 10);

    if (isNaN(noteId)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid note ID' }), { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
        tenantId: user.tenantId,
      },
    });

    if (!note) {
      return new NextResponse(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }

    return NextResponse.json(note);
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized or invalid request.' }), { status: 401 });
  }
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUserFromRequest(request);
    const noteId = parseInt(params.id, 10);
    const { title, content } = await request.json();

    if (isNaN(noteId) || (!title && !content)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
    }

    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
        tenantId: user.tenantId,
      },
    });

    if (!existingNote) {
      return new NextResponse(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        title: title || existingNote.title,
        content: content || existingNote.content,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized or invalid request.' }), { status: 401 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUserFromRequest(request);
    const noteId = parseInt(params.id, 10);

    if (isNaN(noteId)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid note ID' }), { status: 400 });
    }

    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
        tenantId: user.tenantId,
      },
    });

    if (!existingNote) {
      return new NextResponse(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized or invalid request.' }), { status: 401 });
  }
}