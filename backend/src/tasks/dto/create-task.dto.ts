import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../generated/prisma/enums';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login', description: 'Title of the task' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Add JWT-based authentication', description: 'Detailed description of the task' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.todo, description: 'Current status of the task' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ example: 1, description: 'ID of the board this task belongs to' })
  @IsInt()
  boardId: number;
}
