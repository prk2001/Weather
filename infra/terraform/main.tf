# ============================================================
# AETHER Infrastructure — Terraform Configuration
# ============================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "aether-terraform-state"
    key    = "infra/terraform.tfstate"
    region = "us-east-1"
  }
}

# ── Variables ─────────────────────────────────────────────────

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "cloudflare_account_id" {
  type = string
}

variable "environment" {
  type    = string
  default = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

# ── Cloudflare R2 Bucket ──────────────────────────────────────

resource "cloudflare_r2_bucket" "assets" {
  account_id = var.cloudflare_account_id
  name       = "aether-assets-${var.environment}"
  location   = "ENAM" # Eastern North America
}

resource "cloudflare_r2_bucket" "radar" {
  account_id = var.cloudflare_account_id
  name       = "aether-radar-${var.environment}"
  location   = "ENAM"
}

# ── Cloudflare Workers ────────────────────────────────────────

resource "cloudflare_workers_script" "edge" {
  account_id = var.cloudflare_account_id
  name       = "aether-edge-${var.environment}"
  content    = file("${path.module}/../cloudflare-workers/weather-edge.js")
  module     = true

  r2_bucket_binding {
    name        = "RADAR_BUCKET"
    bucket_name = cloudflare_r2_bucket.radar.name
  }

  kv_namespace_binding {
    name         = "CACHE_KV"
    namespace_id = cloudflare_workers_kv_namespace.cache.id
  }

  plain_text_binding {
    name = "API_ORIGIN"
    text = var.environment == "production" ? "https://api.aether.weather" : "https://api-staging.aether.weather"
  }
}

resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.cloudflare_account_id
  title      = "aether-cache-${var.environment}"
}

# ── Cloudflare Workers Route ──────────────────────────────────

resource "cloudflare_workers_route" "api" {
  zone_id     = var.cloudflare_zone_id
  pattern     = var.environment == "production" ? "api.aether.weather/*" : "api-staging.aether.weather/*"
  script_name = cloudflare_workers_script.edge.name
}

# ── DNS Records ───────────────────────────────────────────────

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = var.environment == "production" ? "api" : "api-staging"
  content = "railway-production.up.railway.app"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "web" {
  zone_id = var.cloudflare_zone_id
  name    = var.environment == "production" ? "@" : "staging"
  content = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
}

# ── Outputs ───────────────────────────────────────────────────

output "r2_assets_bucket" {
  value = cloudflare_r2_bucket.assets.name
}

output "r2_radar_bucket" {
  value = cloudflare_r2_bucket.radar.name
}

output "worker_name" {
  value = cloudflare_workers_script.edge.name
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.cache.id
}
