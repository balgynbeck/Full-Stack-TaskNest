import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'My Project Board', description: 'Title of the board' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
