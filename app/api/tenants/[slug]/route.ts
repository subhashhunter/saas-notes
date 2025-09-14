import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user } = await getUserFromRequest(request);
    const { slug } = params;

    if (!slug) {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid tenant slug' }), { status: 400 });
    }

    if (user.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: Only admins can upgrade plans' }), { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: slug,
        id: user.tenantId,
      },
    });

    if (!tenant) {
      return new NextResponse(JSON.stringify({ error: 'Tenant not found or not authorized' }), { status: 404 });
    }

    if (tenant.plan === 'PRO') {
      return NextResponse.json({ ok: true, message: 'Tenant is already on the PRO plan' });
    }

    const upgradedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { plan: 'PRO' },
    });

    return NextResponse.json({
      ok: true,
      message: 'Tenant upgraded to PRO',
      tenant: upgradedTenant,
    });
  } catch (err: any) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: 'Unauthorized or invalid request.' }), { status: 401 });
  }
}