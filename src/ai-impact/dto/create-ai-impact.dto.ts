import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAiImpactDto {
  @IsString()
  @IsNotEmpty()
  squad!: string;

  @IsString()
  @IsNotEmpty()
  aplikasi!: string;

  @IsString()
  @IsOptional()
  aiTool?: string;

  @IsString()
  @IsNotEmpty()
  period!: string;

  // ── Productivity ──
  @IsNumber()
  @Min(1)
  manCount!: number;

  @IsNumber()
  @Min(0)
  daysWithAI!: number;

  @IsNumber()
  @Min(0)
  daysWithoutAI!: number;

  // ── Quality (SonarQube) ──
  @IsNumber()
  @IsOptional()
  sqBugs?: number;

  @IsNumber()
  @IsOptional()
  sqVulnerabilities?: number;

  @IsNumber()
  @IsOptional()
  sqCodeSmells?: number;

  @IsNumber()
  @IsOptional()
  sqCoverage?: number;

  @IsNumber()
  @IsOptional()
  sqDuplications?: number;

  @IsString()
  @IsOptional()
  sqRating?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
