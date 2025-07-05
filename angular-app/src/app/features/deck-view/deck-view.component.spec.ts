import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DeckViewComponent } from './deck-view.component';

describe('DeckViewComponent (UI)', () => {
  let fixture: ComponentFixture<DeckViewComponent>;
  let component: DeckViewComponent;

  beforeEach(async () => {
    // Clear storage to start fresh for each test run
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DeckViewComponent],
    }).compileComponents();

    // Create the component and trigger initial data binding
    fixture = TestBed.createComponent(DeckViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Helper to get the stats text from the DOM
  function getStatsText(): string {
    return fixture.debugElement.query(By.css('.stats')).nativeElement.textContent;
  }

  it('should show initial stats: 52 cards, 0 drawn, 0 points', () => {
    // On first load, deck should be full and nothing drawn
    const text = getStatsText();
    expect(text).toContain('Deck size: 52');
    expect(text).toContain('Drawn: 0 cards');
    expect(text).toContain('Points: 0');
  });

  it('should draw N cards when clicking Draw', fakeAsync(() => {
    // Simulate user entering "3" in the draw count input
    const input = fixture.debugElement.query(By.css('input[type=number]')).nativeElement as HTMLInputElement;
    input.value = '3';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Simulate clicking the Draw button
    const drawBtn = fixture.debugElement.queryAll(By.css('button'))
      .find(btn => btn.nativeElement.textContent.trim() === 'Draw')!;
    drawBtn.nativeElement.click();

    tick();
    fixture.detectChanges();

    // Should reflect 3 cards drawn and points updated
    const text = getStatsText();
    expect(text).toContain('Drawn: 3 cards');
    expect(text).toMatch(/Points: \d+/);
  }));

  it('should reset the deck with jokers when selecting from dropdown', fakeAsync(() => {
    // Simulate selecting "2" jokers from the dropdown
    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    tick();
    fixture.detectChanges();

    // Deck size should now include jokers
    const text = getStatsText();
    expect(text).toContain('Deck size: 54');  // 52 + 2 jokers
  }));

  it('should sort drawn cards putting Clubs before Hearts and jokers last', fakeAsync(() => {
    // Reset deck with 1 joker and manually set drawn cards
    component.onReset(1);
    component['deckService']['drawnSubject'].next([
      { type: 'joker' as const, rank: 'Joker', id: 1 },
      { type: 'standard' as const, suit: 'Hearts', rank: '2', value: 2 },
      { type: 'standard' as const, suit: 'Clubs', rank: 'Ace', value: 14 },
    ]);
    tick();
    fixture.detectChanges();

    // Simulate clicking the "Sort Drawn" button
    const sortBtn = fixture.debugElement
      .queryAll(By.css('button'))
      .find(b => b.nativeElement.textContent.trim() === 'Sort Drawn')!;
    sortBtn.nativeElement.click();
    tick();
    fixture.detectChanges();

    // Check that cards are sorted as expected: Clubs, Hearts, Joker
    const imgs = fixture.debugElement
      .queryAll(By.css('.drawn-area .card-img'))
      .map(de => de.nativeElement.getAttribute('src'));

    expect(imgs.length).toBe(3);
    expect(imgs[0]).toContain('ace_of_clubs');
    expect(imgs[1]).toContain('2_of_hearts');
    expect(imgs[2]).toContain('red_joker');
  }));

  it('should undo and redo an action via the UI buttons', fakeAsync(() => {
    // Draw 1 card to set up undo/redo
    component.onDraw(1);
    tick(); fixture.detectChanges();
    expect(component.drawn.length).toBe(1);

    // Simulate clicking Undo button
    const undoBtn = fixture.debugElement.queryAll(By.css('button'))
      .find(btn => btn.nativeElement.textContent.trim() === 'Undo')!;
    undoBtn.nativeElement.click();
    tick(); fixture.detectChanges();
    expect(component.drawn.length).toBe(0);

    // Simulate clicking Redo button
    const redoBtn = fixture.debugElement.queryAll(By.css('button'))
      .find(btn => btn.nativeElement.textContent.trim() === 'Redo')!;
    redoBtn.nativeElement.click();
    tick(); fixture.detectChanges();
    expect(component.drawn.length).toBe(1);
  }));
});
