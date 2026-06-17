# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
# application.properties is gitignored (repo keeps only the env-driven template),
# so a clean checkout (Railway) has no config. Materialize it from the committed
# example before packaging; all real values come from env vars at runtime.
RUN cp src/main/resources/application.properties.example src/main/resources/application.properties
RUN mvn clean package -DskipTests -B

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Set ownership
RUN chown -R spring:spring /app
USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
