import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBoardDto: CreateBoardDto) {
    return this.prisma.board.create({ data: createBoardDto });
  }

  findAll() {
    return this.prisma.board.findMany({ include: { tasks: true } });
  }

  async findOne(id: number) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: { tasks: { include: { user: true } } },
    });
    if (!board) throw new NotFoundException(`Board #${id} not found`);
    return board;
  }

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({ where: { id }, data: updateBoardDto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.board.delete({ where: { id } });
  }
}
