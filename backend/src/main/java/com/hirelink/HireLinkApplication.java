package com.hirelink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing
public class HireLinkApplication {

    public static void main(String[] args) {
        // Run in UTC (matches the former MySQL serverTimezone=UTC). PostgreSQL validates
        // the session TimeZone and rejects deprecated JVM zone ids like "Asia/Calcutta".
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(HireLinkApplication.class, args);
    }
}
