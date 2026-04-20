import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать новую доску (только ADMIN)' })
  @ApiResponse({ status: 201, description: 'Доска успешно создана' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все доски' })
  @ApiResponse({ status: 200, description: 'Список всех досок' })
  findAll() {
    return this.boardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить доску по ID с задачами' })
  @ApiParam({ name: 'id', type: Number, description: 'ID доски' })
  @ApiResponse({ status: 200, description: 'Доска с задачами' })
  @ApiResponse({ status: 404, description: 'Доска не найдена' })
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить доску (только ADMIN)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID доски' })
  @ApiResponse({ status: 200, description: 'Доска обновлена' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(+id, updateBoardDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Удалить доску по ID (только ADMIN)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID доски' })
  @ApiResponse({ status: 200, description: 'Доска удалена' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.boardsService.remove(+id);
  }
}
