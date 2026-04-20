import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BoardsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userEmail = `e2e-user-${Date.now()}@test.com`;
  const adminEmail = `e2e-admin-${Date.now()}@test.com`;
  const password = 'TestPass123!';

  let userToken: string;
  let adminToken: string;
  let createdBoardId: number;
  let userTaskId: number;
  let adminTaskId: number;

  // ─── Setup ───────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    // Arrange: bootstrap the app exactly like main.ts
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Act: register USER
    const userRegRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: userEmail, name: 'E2E User', password });
    userToken = userRegRes.body.accessToken;

    // Act: register future ADMIN
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: adminEmail, name: 'E2E Admin', password });

    // Act: promote to ADMIN directly via Prisma
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });

    // Act: login as ADMIN to get a token with role=ADMIN in payload
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password });
    adminToken = adminLoginRes.body.accessToken;
  });

  // ─── Teardown ─────────────────────────────────────────────────────────────

  afterAll(async () => {
    // Delete tasks first (FK constraint), then boards, then users
    await prisma.task.deleteMany({
      where: { user: { email: { in: [userEmail, adminEmail] } } },
    });
    await prisma.board.deleteMany({
      where: { title: { in: ['Тестовая доска', 'Доска для задач'] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [userEmail, adminEmail] } },
    });
    await app.close();
  });

  // ─── Критерий 1: миграция выполнена ──────────────────────────────────────

  describe('Критерий 1 — миграция: колонка role у users', () => {
    it('у пользователя есть поле role после регистрации', async () => {
      // Arrange: пользователь уже создан в beforeAll
      // Act
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      // Assert
      expect(user).toBeDefined();
      expect(user?.role).toBe('USER');
    });
  });

  // ─── Критерий 2: /auth/register и /auth/login без токена ─────────────────

  describe('Критерий 2 — POST /auth/register и /auth/login без токена', () => {
    it('POST /auth/register → 201', async () => {
      // Arrange
      const tempEmail = `e2e-temp-${Date.now()}@test.com`;
      // Act
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: tempEmail, name: 'Temp', password });
      // Assert
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      // Cleanup
      await prisma.user.delete({ where: { email: tempEmail } });
    });

    it('POST /auth/login → 200', async () => {
      // Arrange: userEmail уже зарегистрирован
      // Act
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userEmail, password });
      // Assert
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  // ─── Критерий 3: GET /boards без токена → 401 ────────────────────────────

  describe('Критерий 3 — GET /boards без токена', () => {
    it('GET /boards без токена → 401 Unauthorized', async () => {
      // Arrange: запрос без заголовка Authorization
      // Act
      const res = await request(app.getHttpServer()).get('/boards');
      // Assert
      expect(res.status).toBe(401);
    });
  });

  // ─── Критерий 4: GET /boards с токеном USER → 200 ────────────────────────

  describe('Критерий 4 — GET /boards с токеном USER', () => {
    it('GET /boards с токеном USER → 200 OK', async () => {
      // Arrange
      // Act
      const res = await request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${userToken}`);
      // Assert
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── Критерий 5: POST /boards с токеном USER → 403 ───────────────────────

  describe('Критерий 5 — POST /boards с токеном USER', () => {
    it('POST /boards с токеном USER → 403 Forbidden', async () => {
      // Arrange
      // Act
      const res = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Попытка создать доску' });
      // Assert
      expect(res.status).toBe(403);
    });
  });

  // ─── Критерий 6: POST /boards с токеном ADMIN → 201 ─────────────────────

  describe('Критерий 6 — POST /boards с токеном ADMIN', () => {
    it('POST /boards с токеном ADMIN → 201 Created', async () => {
      // Arrange
      // Act
      const res = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Тестовая доска' });
      // Assert
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdBoardId = res.body.id; // сохраняем для следующих тестов
    });
  });

  // ─── Критерий 7: POST /tasks не принимает userId в теле ──────────────────

  describe('Критерий 7 — POST /tasks: userId берётся из токена', () => {
    it('POST /tasks без userId в теле → 201, userId из токена', async () => {
      // Arrange: создаём доску для задач
      const boardRes = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Доска для задач' });
      const boardId = boardRes.body.id;

      // Act: передаём userId в теле — он должен быть проигнорирован
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Задача пользователя', boardId, userId: 9999 });

      // Assert: задача создана, userId берётся из токена, а не из тела
      expect(res.status).toBe(201);
      expect(res.body.userId).not.toBe(9999);

      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      expect(res.body.userId).toBe(dbUser?.id);
      userTaskId = res.body.id;
    });
  });

  // ─── Критерий 8: PATCH /tasks/:id своей задачи → 200 ─────────────────────

  describe('Критерий 8 — PATCH /tasks/:id своей задачи', () => {
    it('PATCH своей задачи → 200 OK', async () => {
      // Arrange: userTaskId создан в предыдущем блоке
      // Act
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Обновлённый заголовок' });
      // Assert
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Обновлённый заголовок');
    });
  });

  // ─── Критерий 9: PATCH /tasks/:id чужой задачи (не ADMIN) → 403 ──────────

  describe('Критерий 9 — PATCH /tasks/:id чужой задачи (USER)', () => {
    it('создать задачу от имени ADMIN', async () => {
      // Arrange: нужна задача, принадлежащая ADMIN
      const boardRes = await request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${adminToken}`);
      const boardId = boardRes.body[0]?.id ?? createdBoardId;

      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Задача админа', boardId });

      expect(res.status).toBe(201);
      adminTaskId = res.body.id;
    });

    it('PATCH чужой задачи (USER пытается обновить задачу ADMIN) → 403', async () => {
      // Arrange: adminTaskId принадлежит ADMIN
      // Act
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${adminTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Попытка взлома' });
      // Assert
      expect(res.status).toBe(403);
    });
  });

  // ─── Критерий 10: DELETE /tasks/:id чужой задачи от ADMIN → 200 ──────────

  describe('Критерий 10 — DELETE /tasks/:id чужой задачи от ADMIN', () => {
    it('DELETE чужой задачи от имени ADMIN → 200 OK', async () => {
      // Arrange: userTaskId принадлежит USER, удаляем от ADMIN
      // Act
      const res = await request(app.getHttpServer())
        .delete(`/tasks/${userTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      // Assert
      expect(res.status).toBe(200);
    });
  });

  // ─── Бонус: GET /users/me ─────────────────────────────────────────────────

  describe('Бонус — GET /users/me', () => {
    it('GET /users/me без токена → 401', async () => {
      // Arrange / Act
      const res = await request(app.getHttpServer()).get('/users/me');
      // Assert
      expect(res.status).toBe(401);
    });

    it('GET /users/me с токеном USER → 200 и есть поле id', async () => {
      // Arrange / Act
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      // Assert
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });

    it('GET /users/me не возвращает поле password', async () => {
      // Arrange / Act
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      // Assert
      expect(res.body.password).toBeUndefined();
    });

    it('GET /users/me возвращает массив tasks', async () => {
      // Arrange / Act
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      // Assert
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });
  });
});
