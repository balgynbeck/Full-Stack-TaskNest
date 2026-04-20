import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, TokenPair } from './interfaces/jwt.interface';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? 'localhost';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    const tokens = this.generateTokens({ sub: user.id, email: user.email });
    this.setRefreshCookie(res, tokens.refreshToken);

    this.setAccessCookie(res, tokens.accessToken);
return { accessToken: tokens.accessToken }
  }

  // ─── Login ────────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, password: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens({ sub: user.id, email: user.email, role: user.role });
    this.setRefreshCookie(res, tokens.refreshToken);

    this.setAccessCookie(res, tokens.accessToken);
    return { accessToken: tokens.accessToken }
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.generateTokens({ sub: user.id, email: user.email });
    this.setRefreshCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  logout(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      domain: COOKIE_DOMAIN,
      secure: true,
      sameSite: 'none',
    });

    return { message: 'Successfully logged out' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private generateTokens(payload: JwtPayload): TokenPair {
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    });

    return { accessToken, refreshToken };
  }

  private setRefreshCookie(res: Response, token: string) {
    const expires = new Date();
    expires.setDate(expires.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    res.cookie('refreshToken', token, {
      httpOnly: true,
      expires,
      domain: COOKIE_DOMAIN,
      secure: true,
      sameSite: 'none',
    });
  }
  private setAccessCookie(res: Response, token: string) {
  res.cookie('accessToken', token, {
    httpOnly: false,        
    sameSite: 'lax',
    secure: false,        
  });
}
}
