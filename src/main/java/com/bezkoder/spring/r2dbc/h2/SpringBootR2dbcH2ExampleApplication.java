package com.bezkoder.spring.r2dbc.h2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
//import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.r2dbc.connection.init.ConnectionFactoryInitializer;
import org.springframework.r2dbc.connection.init.ResourceDatabasePopulator;
import io.r2dbc.spi.ConnectionFactory;

//@EnableR2dbcRepositories
@SpringBootApplication
public class SpringBootR2dbcH2ExampleApplication {

  // Only initialise the H2 schema when NOT running in prod.
  // The prod profile uses spring.sql.init to run schema-prod.sql via R2DBC auto-config.
  @Bean
  @Profile("!prod")
  ConnectionFactoryInitializer initializer(ConnectionFactory connectionFactory) {

    ConnectionFactoryInitializer initializer = new ConnectionFactoryInitializer();
    initializer.setConnectionFactory(connectionFactory);
    initializer.setDatabasePopulator(new ResourceDatabasePopulator(new ClassPathResource("schema.sql")));

    return initializer;
  }

  public static void main(String[] args) {
    SpringApplication.run(SpringBootR2dbcH2ExampleApplication.class, args);
  }

}
