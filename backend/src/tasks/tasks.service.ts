import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../generated/prisma/enums';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto, userId: number) {
    return this.prisma.task.create({
      data: { ...createTaskDto, userId },
      include: { board: true, user: true },
    });
  }

  findAll(status?: TaskStatus) {
    return this.prisma.task.findMany({
      where: status ? { status } : undefined,
      include: { board: true, user: true },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { board: true, user: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number, userRole: string) {
    const task = await this.findOne(id);
    if (task.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only update your own tasks');
    }
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: { board: true, user: true },
    });
  }

  async remove(id: number, userId: number, userRole: string) {
    const task = await this.findOne(id);
    if (task.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own tasks');
    }
    return this.prisma.task.delete({ where: { id } });
  }
}
