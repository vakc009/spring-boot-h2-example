package com.bezkoder.spring.r2dbc.h2.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bezkoder.spring.r2dbc.h2.model.Tutorial;
import com.bezkoder.spring.r2dbc.h2.repository.TutorialRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
public class TutorialServiceTest {

  @Mock
  private TutorialRepository tutorialRepository;

  @InjectMocks
  private TutorialService tutorialService;

  private Tutorial t1;
  private Tutorial t2;

  @BeforeEach
  public void setUp() {
    t1 = new Tutorial();
    t1.setId(1);
    t1.setTitle("First");
    t1.setDescription("desc1");
    t1.setPublished(true);

    t2 = new Tutorial();
    t2.setId(2);
    t2.setTitle("Second");
    t2.setDescription("desc2");
    t2.setPublished(false);
  }

  @Test
  public void testFindAll() {
    when(tutorialRepository.findAll()).thenReturn(Flux.just(t1, t2));

    StepVerifier.create(tutorialService.findAll())
        .expectNext(t1)
        .expectNext(t2)
        .verifyComplete();
  }

  @Test
  public void testFindByTitleContaining() {
    when(tutorialRepository.findByTitleContaining("First")).thenReturn(Flux.just(t1));

    StepVerifier.create(tutorialService.findByTitleContaining("First"))
        .expectNext(t1)
        .verifyComplete();
  }

  @Test
  public void testFindByIdFound() {
    when(tutorialRepository.findById(1)).thenReturn(Mono.just(t1));

    StepVerifier.create(tutorialService.findById(1))
        .expectNextMatches(t -> t.getId() == 1 && "First".equals(t.getTitle()))
        .verifyComplete();
  }

  @Test
  public void testFindByIdNotFound() {
    when(tutorialRepository.findById(99)).thenReturn(Mono.empty());

    StepVerifier.create(tutorialService.findById(99))
        .verifyComplete();
  }

  @Test
  public void testSave() {
    Tutorial toSave = new Tutorial();
    toSave.setTitle("New");
    toSave.setDescription("d");

    when(tutorialRepository.save(any(Tutorial.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

    StepVerifier.create(tutorialService.save(toSave))
        .expectNextMatches(saved -> "New".equals(saved.getTitle()) && saved.getDescription().equals("d"))
        .verifyComplete();
  }

  @Test
  public void testUpdateWhenPresentAddsPrefix() {
    Tutorial input = new Tutorial();
    input.setTitle("X");

    when(tutorialRepository.findById(1)).thenReturn(Mono.just(t1));
    when(tutorialRepository.save(any(Tutorial.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

    StepVerifier.create(tutorialService.update(1, input))
        .expectNextMatches(updated -> updated.getId() == 1 && updated.getTitle().startsWith("Update ")
            && updated.getTitle().endsWith("X"))
        .verifyComplete();
  }

  @Test
  public void testUpdateWhenPresentDoesNotDoublePrefix() {
    Tutorial input = new Tutorial();
    input.setTitle("Already");

    when(tutorialRepository.findById(2)).thenReturn(Mono.just(t2));
    when(tutorialRepository.save(any(Tutorial.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

    StepVerifier.create(tutorialService.update(2, input))
        .expectNextMatches(updated -> updated.getId() == 2 && updated.getTitle().equals("Update Already"))
        .verifyComplete();
  }

  @Test
  public void testUpdateWhenTitleAlreadyStartsWithUpdatePrefixNotDoubled() {
    Tutorial input = new Tutorial();
    input.setTitle("Update Existing");

    when(tutorialRepository.findById(1)).thenReturn(Mono.just(t1));
    when(tutorialRepository.save(any(Tutorial.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

    StepVerifier.create(tutorialService.update(1, input))
        .expectNextMatches(updated -> updated.getId() == 1 && updated.getTitle().equals("Update Existing"))
        .verifyComplete();
  }

  @Test
  public void testUpdateWhenTitleIsNullNoPrefixAdded() {
    Tutorial input = new Tutorial();
    input.setTitle(null);
    input.setDescription("desc");

    when(tutorialRepository.findById(1)).thenReturn(Mono.just(t1));
    when(tutorialRepository.save(any(Tutorial.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

    StepVerifier.create(tutorialService.update(1, input))
        .expectNextMatches(updated -> updated.getId() == 1 && updated.getTitle() == null)
        .verifyComplete();
  }

  @Test
  public void testUpdateWhenAbsentReturnsEmpty() {
    Tutorial input = new Tutorial();
    input.setTitle("X");

    when(tutorialRepository.findById(999)).thenReturn(Mono.empty());

    StepVerifier.create(tutorialService.update(999, input))
        .verifyComplete();
  }

  @Test
  public void testDeleteById() {
    when(tutorialRepository.deleteById(1)).thenReturn(Mono.empty());

    StepVerifier.create(tutorialService.deleteById(1))
        .verifyComplete();

    verify(tutorialRepository).deleteById(1);
  }

  @Test
  public void testDeleteAll() {
    when(tutorialRepository.deleteAll()).thenReturn(Mono.empty());

    StepVerifier.create(tutorialService.deleteAll())
        .verifyComplete();

    verify(tutorialRepository).deleteAll();
  }

  @Test
  public void testFindByPublished() {
    when(tutorialRepository.findByPublished(true)).thenReturn(Flux.just(t1));

    StepVerifier.create(tutorialService.findByPublished(true))
        .expectNext(t1)
        .verifyComplete();
  }
}

