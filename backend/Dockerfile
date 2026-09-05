# Build stage: the official Maven+Temurin image already bundles a Maven
# matching this project's Java 21 (section 3), so the build uses it directly
# rather than the committed ./mvnw wrapper — mvnw exists for a consistent
# *local* dev Maven version, but a Docker build stage is already a
# controlled, throwaway environment, so there's nothing for the wrapper to
# protect against here.
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY pom.xml ./
RUN mvn -B dependency:go-offline
COPY src ./src
# Tests need a real Postgres connection (TaskRepositoryTest,
# SecurityIntegrationTest) that isn't available during an isolated image
# build — mvn test already runs as its own dedicated, documented step
# (CLAUDE.md section 14), not something to re-run here.
RUN mvn -B package -DskipTests

# Run stage: a JRE, not a JDK, is enough to run an already-built jar.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
