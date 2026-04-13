import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateLicenseDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  userType!: string;

  @IsString()
  @IsNotEmpty()
  departemen!: string;

  @IsString()
  @IsNotEmpty()
  aplikasi!: string;

  @IsString()
  @IsNotEmpty()
  squad!: string;

  @IsInt()
  @IsNotEmpty()
  teamId!: number;

  @IsString()
  @IsOptional()
  status?: string;
}
