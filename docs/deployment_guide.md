# Deployment Guide & Production Checklist

## 1. Local Container Deploy (Docker Compose)

Spin up NestJS, Next.js, Nginx, PostgreSQL, Redis, Elasticsearch, Prometheus, and Grafana in a unified bridge network:

```bash
docker compose up -d --build
```

Verify container states:

```bash
docker compose ps
```

---

## 2. Infrastructure Provisioning (Terraform)

Navigate to `terraform/` and run provision workflows:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

**Provisioned Resources**:

- AWS VPC (10.0.0.0/16) with isolated subnets
- AWS RDS instance running PostgreSQL 15
- AWS IAM Roles & security policies
- AWS EKS Kubernetes Cluster

---

## 3. Kubernetes Manifest Deployment (kubectl)

Apply deployments to the EKS cluster namespace:

```bash
# Apply secrets & environment maps
kubectl apply -f kubernetes/secret.yaml

# Apply deployments
kubectl apply -f kubernetes/deployment.yaml

# Apply routing services
kubectl apply -f kubernetes/service.yaml
```

---

## 4. Production Release Checklist

- [x] **Secure Headers**: Confirm `helmet` Express middleware is active.
- [x] **Rate Limiters**: Check global limits are configured (`@nestjs/throttler`).
- [x] **Database Indexing**: Check `@@index` parameters are applied to query indices.
- [x] **Secrets Isolation**: Verify database credentials and private JWT secrets are mapped using EKS `Secret` resource parameters, not committed in code.
- [x] **Query Caching**: Verify Redis caching is active on heavy endpoints.
- [x] **Images**: Ensure Next.js optimization formats are active.
- [x] **CSRF / CORS Rules**: Whitelist explicit domain origins in NestJS `main.ts` settings.
