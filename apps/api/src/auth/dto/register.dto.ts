import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRoleName } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'customer@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Rahul' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ enum: UserRoleName, default: UserRoleName.CUSTOMER })
  @IsEnum(UserRoleName)
  role!: UserRoleName;
}
