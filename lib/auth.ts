import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'subhash';


export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}


export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}


export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new Error('No authorization header');

  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('No token provided');

  const decoded: any = verifyToken(token);
  if (!decoded) throw new Error('Invalid token');

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { tenant: true }
  });

  if (!user) throw new Error('User not found');
  return { user, tokenPayload: decoded };
}


export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}


export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
