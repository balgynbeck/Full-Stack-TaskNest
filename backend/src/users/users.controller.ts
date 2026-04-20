import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Authorized } from '../auth/decorators/authorized.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя с задачами' })
  @ApiResponse({ status: 200, description: 'Профиль текущего пользователя' })
  getMe(@Authorized('id') userId: number) {
    return this.usersService.getMe(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID с его задачами' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь с задачами' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь удалён' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
