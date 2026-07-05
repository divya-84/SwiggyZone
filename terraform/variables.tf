variable "aws_region" {
  type        = string
  description = "Target AWS provisioning region"
  default     = "ap-south-1"
}

variable "db_username" {
  type        = string
  description = "Database administrator username"
  default     = "postgres"
}

variable "db_password" {
  type        = string
  description = "Database administrator password"
  sensitive   = true
}
