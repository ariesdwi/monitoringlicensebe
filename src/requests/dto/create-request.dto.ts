import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsNotEmpty()
  departemen!: string;

  @IsString()
  @IsNotEmpty()
  aplikasi!: string;

  @IsString()
  @IsNotEmpty()
  squad!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsNotEmpty()
  userType!: string;

  @IsString()
  @IsNotEmpty()
  aiTool!: string;
}
