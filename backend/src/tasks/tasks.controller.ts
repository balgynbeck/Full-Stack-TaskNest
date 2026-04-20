import { Controller, Get, Post, Body, Param, Delete, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../generated/prisma/enums';
import { Authorized } from '../auth/decorators/authorized.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую задачу (userId берётся из токена)' })
  @ApiResponse({ status: 201, description: 'Задача успешно создана' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Authorized('id') userId: number,
  ) {
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все задачи (с фильтрацией по статусу)' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false, description: 'Фильтр по статусу задачи' })
  @ApiResponse({ status: 200, description: 'Список задач' })
  findAll(@Query('status') status?: TaskStatus) {
    return this.tasksService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задачу по ID с пользователем' })
  @ApiParam({ name: 'id', type: Number, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Задача с данными пользователя' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить задачу (только владелец или ADMIN)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Задача обновлена' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Authorized('id') userId: number,
    @Authorized('role') userRole: string,
  ) {
    return this.tasksService.update(+id, updateTaskDto, userId, userRole);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу (только владелец или ADMIN)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID задачи' })
  @ApiResponse({ status: 200, description: 'Задача удалена' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(
    @Param('id') id: string,
    @Authorized('id') userId: number,
    @Authorized('role') userRole: string,
  ) {
    return this.tasksService.remove(+id, userId, userRole);
  }
}
