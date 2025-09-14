import { comparePassword, signToken } from '@/lib/auth';
import {prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
   
    const { email, password } = await request.json();

  
    if (!email || !password) {
      return new NextResponse(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, 
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

   
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

   
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    
    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant: {
        id: user.tenantId,
        slug: user.tenant.slug,
      },
    };


    return NextResponse.json({ token, user: userResponse }, { status: 200 });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}