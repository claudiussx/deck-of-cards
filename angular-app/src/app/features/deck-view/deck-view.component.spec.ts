import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DeckViewComponent } from './deck-view.component';

describe('DeckViewComponent (UI)', () => {
  let fixture: ComponentFixture<DeckViewComponent>;
  let component: DeckViewComponent;

  beforeEach(async () => {
  // Clear storage to start fresh
  localStorage.clear();

  await TestBed.configureTestingModule({
    imports: [ DeckViewComponent ],
  }).compileComponents();

  fixture = TestBed.createComponent(DeckViewComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});


  function getStatsText(): string {
    return fixture.debugElement.query(By.css('.stats')).nativeElement.textContent;
  }

  it('should show initial stats: 52 cards, 0 drawn, 0 points', () => {
    const text = getStatsText();
    expect(text).toContain('Deck size: 52');
    expect(text).toContain('Drawn: 0 cards');
    expect(text).toContain('Points: 0');
  });


  it('should draw N cards when clicking Draw', fakeAsync(() => {
    // set draw count to 3
    const input = fixture.debugElement.query(By.css('input[type=number]')).nativeElement as HTMLInputElement;
    input.value = '3';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // click the Draw button
    const drawBtn = fixture.debugElement.queryAll(By.css('button'))
      .find(btn => btn.nativeElement.textContent.trim() === 'Draw')!;
    drawBtn.nativeElement.click();

    tick();
    fixture.detectChanges();

    const text = getStatsText();
    expect(text).toContain('Drawn: 3 cards');
    expect(text).toMatch(/Points: \d+/);
  }));

  it('should reset the deck with jokers when selecting from dropdown', fakeAsync(() => {
    // select 2 jokers
    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    tick();
    fixture.detectChanges();

    const text = getStatsText();
    expect(text).toContain('Deck size: 54');  // 52 + 2 jokers
  }));

  it('should sort drawn cards putting Clubs before Hearts and jokers last', fakeAsync(() => {
    component.onReset(1);
    component['deckService']['drawnSubject'].next([
      { type: 'joker' as const,  rank: 'Joker',   id: 1 },
      { type: 'standard' as const, suit: 'Hearts', rank: '2',    value: 2 },
      { type: 'standard' as const, suit: 'Clubs',  rank: 'Ace',  value: 14 },
    ]);
    tick();
    fixture.detectChanges();

    const sortBtn = fixture.debugElement
      .queryAll(By.css('button'))
      .find(b => b.nativeElement.textContent.trim() === 'Sort Drawn')!;
    sortBtn.nativeElement.click();
    tick();
    fixture.detectChanges();

    const imgs = fixture.debugElement
      .queryAll(By.css('.drawn-area .card-img'))
      .map(de => de.nativeElement.getAttribute('src'));

    expect(imgs.length).toBe(3);
    expect(imgs[0]).toContain('ace_of_clubs');   
    expect(imgs[1]).toContain('2_of_hearts');
    expect(imgs[2]).toContain('red_joker');         
  }));

  it('should undo and redo an action via the UI buttons', fakeAsync(() => {
    // draw 1 card
    component.onDraw(1);
    tick(); fixture.detectChanges();
    expect(component.drawn.length).toBe(1);

    // click Undo
    const undoBtn = fixture.debugElement.queryAll(By.css('button'))
      .find(btn => btn.nativeElement.textContent.trim() === 'Undo')!;
    undoBtn.nativeElement.click();
    tick(); fixture.detectChanges();
    expect(component.drawn.length).toBe(0);

    // click Redo
    const redoBtn = fixture.debugElement.queryAll(By.css('button'))
      .find(btn => btn.nativeElement.textContent.trim() === 'Redo')!;
    redoBtn.nativeElement.click();
    tick(); fixture.detectChanges();
    expect(component.drawn.length).toBe(1);
  }));
});
