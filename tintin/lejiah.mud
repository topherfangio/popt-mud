#nop The first line needs to start with a # so tt++ doesn't try to change
#nop the command character!

/*
 * Welcome to PotP MUD and TinTin++ (tt++) scripting!
 *
 * There is so much you can do in this file! Hopefully the commands below
 * will give you a good starting point and push you in the right direction.
 *
 * See https://tintin.mudhalla.net/manual/ for more info!
 *
 * COMMANDS
 *
 * Below are some frequently used tt++ scripting commands.
 *
 * #action     - Trigger a script in response to text you see
 * #alias      - Define a shortcut for a command or multiple commands
 * #echo       - Print out to terminal
 * #highlight  - Highlight some text in a specific color
 * #math       - Perform some calculations
 * #nop        - No Operation: do nothing, can use for comments
 * #showme     - Print out AND fire #acions / #highlights / etc
 * #substitute - Replace some text with something else
 * #var        - Define a variable to use in #math
 */

/*
 * Start your journey off right by giving the user some instructions!
 */
#echo {Begin your adventure...play}; #echo {}

#alias {play} {reset; #session A potp-mud.com 6400}
#alias {play2} {#session B potp-mud.com 6400}
#alias {reset} {#kill all; #read lejiah.mud; fullp;}
#alias {ls} {l}
#alias {man} {help}
#alias {ehal} {heal}
#alias {eag} {withdraw all;exchange all to gold;deposit all}
#alias {heron} {forms def hwr; forms off hwr}
#alias {heroff} {forms clear}
#alias {windon} {forms def abw; forms off abw}
#alias {windoff} {forms clear}
#alias {wateron} {forms def tws; forms off tws}
#alias {wateroff} {forms clear}
#alias {combo} {forms combo how abw}
#alias {lock} {rem sword; rem clay; get lock bag; wear lock}
#alias {razor} {rem sword; rem clay; get razor bag; wear razor; #6 shave}
#alias {readyclimb} {rem sword; rem sword; get rope bag; wear rope}
#alias {attack} {rem lock; rem rope; rem razor; put lock bag; put rope bag; put razor bag; wear clay; dual sword}
#alias {dsac %0} {drop %0; sac %0}

#alias {reswalkin} {walkin \x7bwBe\x7bWi\x7bwng\x7bx \x7bro\x7bRn\x7bre \x7bwwith \x7bWSa\x7bwid\x7bWin, \x7bGL\x7bDe\x7bgj\x7bGh\x7bgi\x7bDa \x7bwslips in from }
#alias {reswalkout} {walkout \x7bWWa\x7bwlk\x7bWing \x7bwin \x7brci\x7bRrcl\x7bres\x7bw, \x7bGL\x7bDe\x7bgj\x7bGh\x7bgi\x7bDa \x7bwwanders out }
#alias {resrdesc} rdesc \x7brsits \x7bwand fills himself with \x7bWSa\x7bwid\x7bWin.
#alias {clan} clantalk \x7bw
/*
#alias {score} {sco; gcom list}
*/
#alias {glo} global \x7bw

#alias {varoff} {#message variables}
#alias {bid} {au bankbid}
#alias {qr %0} {quest request %0}
#alias {qc} {quest complete}
#alias {ogd %0} {open %0; get all %0; dsac %0}
#alias {sackboxes} {get all.strong sack; get all.chest sack; get all.coff sack; get all.trunk sack; get all.strong sack; get all.safe sack; get all.coin sack}
#alias {putboxes} {put all.strong sack; put all.chest sack; put all.coff sack; put all.trunk sack; put all.strong sack; put all.safe sack; put all.coin sack}
#alias {dropboxes} {drop all.strong sack; drop all.chest sack; drop all.coff sack; drop all.trunk sack; drop all.strong sack; drop all.safe sack; drop all.coin sack}
#alias {getboxes} {get all.strong; get all.chest; get all.coff; get all.trunk; get all.strong; get all.safe; get all.coin}
#alias {getsboxes %0} {get all.strong %0; get all.chest %0; get all.coff %0; get all.trunk %0; get all.strong %0; get all.safe %0; get all.coin %0}
#alias {free} {flee;recall;sleep tent;save}
#alias {crecall} {creca; sleep sofa}
#alias {k %0} {sneak; ambush %0; shatter %0}

#action {Reconnecting.} {varoff; wake; grasp; windon}
#action {Remember to read Help Policy to see if anything has changed.} {varoff; wake; grasp; windon}

#action {%0 !!! DISARMS !!! you %1} {get sword; wear sword; get dagger; dual dagger;}

#action {Your pulse speeds up, but nothing happens.} {berserk}

#action {a %0 is DEAD!} {butcher corpse}
#action {an %0 is DEAD!} {butcher corse}
#action {A %0 is DEAD!} {butcher corse}
#action {An %0 is DEAD!} {butcher corse}

#action {You return to the keyboard.} {replay}
#action {You have messages waiting.} {replay}
#action {Alfie attacks the %0.} {kill %0}

#alias {sw} {southwest}
#alias {nw} {northwest}
#alias {se} {southeast}
#alias {ne} {northeast}

#alias {tt %0} {tell tichan %0}
#alias {tar %0} {tell archemedies %0}
#alias {ta %0} {tell alfie %0}
#alias {tl %1} {tell lavila %1}
#alias {te %1} {tell esban %1}
#alias {ts %1} {tell sakana %1}

#alias {shortp} {prompt %b%c%B%c<%h/%Hhp %m/%Mmv %X/%xxp Lvl:%L> }
#alias {fullp} {prompt %b%c%B%c<\x7bG%h\x7bx/%Hhp \x7bG%m\x7bx/%Mmv [\x7bY%g.%s-%G.%S\x7bx] Lvl:\x7bW%L\x7bx \x7bW%X\x7bxxp> }

#action {The %0 %1 is closed} {open %1;%1}
#action {Alfie wishes to join your group} {group Alfie}
#action {Archemedies wishes to join your group.} {group Archemedies}
#action {Curtis wishes to join your group.} {group Curtis}
#action {Mallekih wishes to join your group} {group Mallekih}

#action {You lose the Void.} {void}
#action {You push the Void away.} {void}
#action {You focus, but the Flame} {void}

#action {You fail to move silently.} {sneak}

#action {You wake} {grasp; void}

#var {oldxp} {0};
#var {xpdifference} {0};

#var {oldhp} {0};
#var {hpdifference} {0};

#var {oldmana} {0};
#var {manadifference} {0};

#var {oldlvl} {0};
#var {lvldifference} {0};

#action {<%0/%1hp %2/%3mv [%4-%5] Lvl:%6 %7xp> }
{

  #nop -----------BEGIN HP MATH------------;

  #math {hpdifference}  { %0 - $oldhp };

  #if { $hpdifference > 0 }
  {
     #showme You healed $hpdifference hp!;
  };

  #var {hpdifference} {0};
  #var {oldhp} {%0};

  #nop -- Max HP Math --;

  #math {maxhpdifference}  { %1 - $oldmaxhp };

  #if { $maxhpdifference > 0 }
  {
     #showme You gained $maxhpdifference hp!;
  };

  #var {maxhpdifference} {0};
  #var {oldmaxhp} {%1};

  #nop -----------END HP MATH------------;


  #nop -----------BEGIN MOVE MATH------------;

  #math {movdifference}  { %2 - $movold };

  #if { $movdifference > 0 }
  {
     #showme You restored $movdifference move!;
  };

  #var {movdifference} {0};
  #var {movold} {%2};

  #nop -- Max Move Math --;

  #math {maxmovdifference}  { %3 - $oldmaxmov };

  #if { $maxmovdifference > 0 }
  {
     #showme You gained $maxmovdifference max move!;
  };

  #var {maxmovdifference} {0};
  #var {oldmaxmov} {%3};

  #nop -----------END MOVE MATH------------;


  #nop -----------BEGIN LEVEL MATH------------;

  #math {lvldifference}  { %6 - $lvlold };

  #if { $lvldifference > 0 }
  {
     #showme You gained $lvldifference level!;
  };

  #var {lvldifference} {0};
  #var {lvlold} {%6};

  #nop -----------END LEVEL MATH------------;
}

#highlight {You feel the divine power of the Creator flow through your body.} {light green}
#highlight {You healed %0 hp!} {light yellow}
#highlight {You restored %0 move!} {light yellow}
#highlight {You gained %0 mana!} {light yellow}
#highlight {You gained %0 max move!} {light yellow}
#highlight {You gained %0 xp!} {light yellow}
#highlight {You gained %0 level!} {light yellow}
#highlight {You gain 1 train!} {light yellow}
#highlight {You gain %0 trains!} {light yellow}
#highlight {* You feel your power in %0 increase *} {light yellow}
#highlight {You critically strike %0} {light yellow}
#highlight {You have %0 training sessions left.} {white}
#highlight {Your patient is up to %0 percent of %1 health.} {light yellow}

#substitute {Your %0 %1 %2. [%3]} {<119>Your %0 %1 %2. <029>[<119>%3<029>]<099>}
#substitute {Your %0 %1 %2! [%3]} {<119>Your %0 %1 %2! <029>[<119>%3<029>]<099>}
#substitute {You say oocly, '%0'} {You say oocly, '<079>%0'}

#var {wlvl} {22}
#var {gatelvl} {18}

#alias {smallup}
{
  grasp;
  weave $wlvl 'defense' lejiah;
  weave $wlvl 'fire shield' lejiah;
  weave $wlvl 'shield' lejiah;
  weave $wlvl 'vigor' lejiah;
  weave $wlvl 'quicken' lejiah;
  weave $wlvl 'sixth sense' lejiah;
  weave $wlvl 'seeing';
}

#alias {weaveup}
{
  weave $wlvl 'defense' lejiah;
  weave $wlvl 'fire shield' lejiah;
  weave $wlvl 'shield' lejiah;
  weave $wlvl 'vigor' lejiah;
  weave $wlvl 'advanced shield' lejiah;
  weave $wlvl 'bigger' lejiah;
  weave $wlvl 'fortitude' lejiah;
  weave $wlvl 'quicken' lejiah
}
#alias {wup %0}
{
  weave $wlvl 'defense' %0;
  weave $wlvl 'fire shield' %0;
  weave $wlvl 'shield' %0;
  weave $wlvl 'vigor' %0;
  weave $wlvl 'advanced shield' %0;
  weave $wlvl 'bigger' %0;
  weave $wlvl 'fortitude' %0;
  weave $wlvl 'quicken' %0
}

#alias {cureme} {weave $wlvl 'cure light' lejiah}
#alias {healme} {weave $wlvl 'cure serious' lejiah}

#alias {air %0} {weave $wlvl 'airclub' %0}
#alias {blind %0} {weave $wlvl 'blind' %0}
#alias {burn %0} {weave $wlvl 'burn' %0}
#alias {defense} {weave $wlvl 'lejiah' %0}
#alias {defense %0} {weave $wlvl 'defense' %0}
#alias {fire %0} {weave $wlvl 'fire bolt' %0}
#alias {fireshield %0} {weave $wlvl 'fire shield' %0}
#alias {flog %0} {weave $wlvl 'flog' %0}
#alias {gate %0} {weave $gatelvl 'gate' %0}
#alias {glow %0} {weave $wlvl 'glow' %0}
#alias {ham %0} {weave $wlvl 'spirit hammer' %0}
#alias {hammer %0} {weave $wlvl 'spirit hammer' %0}
#alias {heal %0} {weave $wlvl 'cure serious' %0}
#alias {hold %0} {weave $wlvl 'hold' %0}
#alias {invert %0} {weave $wlvl 'invert' %0}
#alias {lightning %0} {weave $wlvl 'lightning' %0}
#alias {thunder %0} {weave $wlvl 'thunder lance' %0}
#alias {see %0} {weave $wlvl 'see light' %0; weave $wlvl 'see shadow' %0; weave $wlvl 'see hidden' %0; weave $wlvl 'see invis' %0}
#alias {shatter %0} {weave $wlvl 'shatter' %0}
#alias {vigor} {weave $wlvl 'vigor' lejiah}
#alias {vigor %0} {weave $wlvl 'vigor' %0}

#nop ---- Close Places (from recall) ----
#alias {bank} {up; go caemlyn; east; go bank;}
#alias {back} {go plaza; west;}

#alias {rejog} {recall; reset; u; go cae;}

#nop ---- GOOD Jogs (from Caemlyn) ----
#alias {aringill} {jog 9e^open east^jog 5e s 9e n 3e n 4e}
#alias {baerlon} {jog 5w s 2w n 3w ^open west^ jog 29w k 2w h 37w n 3w 3n w 2n w 2n 3w 4n 4w 14n}
#alias {breens} {jog 5w s 2w n 3w ow 10w}
#alias {cairhien} {jog 9e oe 5e s 9e n 3e n 17e 4n e 3n e 6n e 2n e n e 18n on n}
#alias {caralain} {jog 5w s 2w n 3w ow 21w 3n w 2n e n w n e 2n}
#alias {crays} {jog 5w s 2w n 3w ow 17w 5s}

#nop ---- TESTING / CLOSE Jogs (from Caemlyn) [kinda works, just needs some fiddling] ----

#alias {deven} {jog 5w s 2w n 3w ow 17w k 2w h 37w n 3w 3n w 2n w 2n 3w 4n 4w 11s l 3e 11s e s e s e 15s e s e 2s e s e 4s e s e 4s 2e}

#nop ---- BAD Jogs (from Caemlyn) ----
#alias {banditcamp} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 4n u n e 2n d n w 3n e 2n 3e^go waygate^jog n j e j n j 2e 2j e s w 3s w s 2w n w h}
#alias {baeb} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 3n 3e d e u e u e^go waygat^jog e l 3s 2e s l 2s e j e l 3e 2l 3e h 3n 2j 2n h 2n 2w 2n on n}
#alias {brhc} {jog 8n 2e 3n^open north^jog 8n j 2n j n h 3w}

#nop ---- UNTESTED Jogs (From Caemlyn) ----
#alias {blight} {jog 7e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 4n u n e 2n d n w 3n e 2n 3e^go waygate^jog n j e j n j 2e 2j 4e n e n 4e 11n j oe 2e n 3e n 6e^go gap^jog 2w 2n w}
#alias {border} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 4n u n e 2n d n w 3n e 2n 3e^go waygate^jog n j e j n j 2e 2j 4e n e n 4w s u 8n 3e d s 5w 3n on n 2j 2n 3h 2n}
#alias {bandareben} {jog 6e5se6sodd^go way^jog 3e nd5nde3n eu5n w2ndnd3n 3edeueue^go way^jog el3s2e sl2sejel3e 2l3eh3n 2j2nh2n2w2nonn}
#alias {caerin} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 3n 3e d e u e u e^go waygate^jog l 3s 2e s l2s e j e l 3e 2l 3e h 3n 2j 2n h 2n 2e}
#alias {canl} {jog 8n 2e 3n on 8n j 2n j n h j n e h 5n j 2n 3j 2n j h n j 2n j n h j n 2j 5n e 9n 5e 5n 5e 10n e 7n w 3n w 3n e n e 4n 4h n 2h 3n h n 2h w h w h 2w 6h n 2h n 2h n 3h 2n 3h 2w 6h 10w h n 2w n h}
#alias {darein} {jog 8n 2e 3n on 8n j 2n j n h j n e h 5n j 2n 3j 2n j h n j 2n j n h j n 2j 5n e 9n 5e 5n 5e 10n e 3n 2j e 2j 3e}
#alias {dumais} {jog 8n 2e 3n on 8n j 2n j n h j n e h 5n j 2n 3j 2n j h n j 2n j n h j n 2j 5n e 9n 5e 5n 5e 10n 8e s 2e 2s e s e 3s e 2s}
#alias {ebou} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e}
#alias {elmora} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e 6n 6e n on 3n e 9n h 2n h 3n 2h n j 2h 6n h j n 2h j n 2h 3w 2h 3w k 3w 2h 5w 5h 3j 2e oe e}
#alias {emonds} {jog 5w s 2w n 3w ow 17w k 2w h 37w n 3w 3n w 2n w 2n 3w 4n 4w 11s l 3e 11s e s e s e 15s e s e 2s e s e s 2w}
#alias {faldara} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 4n u n e 2n d n w 3n e 2n 3e^go waygate^jog n j e j n j 2e 2j 4e n e n}
#alias {falmoran} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 4n u n e 2n d n w 3n e 2n 3e^go waygate^jog n j e j n j 2e 2j e s w 3s 2l 5e l 3e oe e oe e oe e}
#alias {foregate} {jog 9e^open e^jog 4e s 9e n 3e n 17e 4n e 3n e 6n e 2n e n e 5n}
#alias {falme} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 3n 3e d e u e u e^go waygate^jog 9s 10w}
#alias {farmadding} {jog 9e oe 5e 5s 3k 2s 2l 3s l s l 2s k 2s l s k 2l s k s 3l 3s k l 2s l 5s k s l 2s k 2l 3k s 2l 2s l 7s 9k s}
#alias {fourkings} {jog 5w s 2w n 3w ow 17w k 2w h 9w}
#alias {haddonmirk} {jog 9e oe 5e s 9e n 3e n 17e 2s e s e 2s}
#alias {illian} {jog 5ws2wn3wow17wk2wh12w7sw2swswsws3ws2ws4w5se2se3se8se2sw2sw42s}
#alias {illiann} {jog 5w s 2w n 3w 17w k 2w h 12w 7s w 2s w s w s w s 3w s 2w s 4w 5s e 2s e 3s e 8s e 2s w 2s w 11s}
#alias {jangai} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 2e 3d s d e d s d 2e s 2d e 2s e s d e 2n e s 2w d e s d n j^go waygate^climb up}
#alias {katar} {jog 6e 5s e 6s d^go waygate^jog 3e n d 2n 2e 3d s d e d s d 2e s 2d e 2s e s d e 2n e s 2w 2n 2e u n w^go waygate^jog s k s h w k h w ow w}
#alias {losttower} {jog 5w s 2w n 3w ow 17w k 2w h 12w 7s w 2s w s w s w s 3w s 2w s 11w s 3w s 5w s 2w 2n 2e}
#alias {lugard} {jog 5w s 2w n 3w ow 17w k 2w h 12w 7s w 2s w s w s w s 3w s 2w s 6w s ow w}
#alias {maradon} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 3n 3e d e u e u e^go waygat^jog e l 3s 2e s l 2s e j e l 3e 2l 3e h 3n 2j 2n h 2n 2w 2n on 2n 2w 6n^go coach^say gates^jog oe 2e 3j 5n 2j 4n 2e 3n j 2n 3j 2n 2e j e 2j 2n 2j e 3n 3j 2n 2e 2j 2n 2j n 2j n j 4e 2j 2e 3j 3e 2j e j e 3j e j e 10j 7e j 4n 4j e 5j e 4j 7n}
#alias {market} {jog 6n 3e s}
#alias {stedding} {jog 9e oe 5e s 9e n 3e n 17e 4n e 3n e 3n 4e n e 3s 2w on n}
#alias {tamielle} {jog 5w s 2w n 3w ow 17w k 2w h 12w 7s w 2s w s w s w s 3w s 2l ol l}
#alias {tanc} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 5n d e 3n e u 5n w 2n d n d 3n 3e d e u e u e^go waygate^jog 9s 2e 2j 2e j e l 3e 2l 3e 5s l 4s 2l s 3l 2s 2l 7s 3k 3s 2k 3s 2k 2s 3k s w 3s}
#alias {tarrenferry} {jog 5w s 2w n 3w ow 17w k 2w h 37w n 3w 3n w 2n w 2n 3w 4n 4w 11s l 3e}
#alias {tarv} {jog 8n 2e 3n on 8n j 2n j n h j n e h 5n j 2n 3j 2n j h n j 2n j n h j n 2j 5n e 9n 5e 5n 5e 10n 6e 2n N e 2N e 2N e 2N e 2N e 2N n 6N e }
#alias {tear} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 2e 3d s d e d s d 2e s 2d e 2s e s d 2e 3s 4e 3u e^go waygate^jog w 2k 2w h 2w 2h w ow w}
#alias {watchhill} {jog 5w s 2w n 3w ow 17w k 2w h 37w n 3w 3n w 2n w 2n 3w 4n 4w 11s l 3e 11s e s e s e 10s 2e}
#alias {whitebridge} {jog 5w s 2w n 3w ow 17w k 2w h 28w}
#alias {madmen} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e 6s 11e 2s}
#alias {kin house} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e 6s 8e 2n oe e}
#alias {seanchancamp} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e 6n 6e n on 3n e 9n h 2n h 3k w k s 2k w k w s l s k 4w k 2w k w k 2s 2k 4s}
#alias {shadowcoast} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e 6n 6e n on 3n e 9n h 2n h 3k w k s 2k w k 2w k 3w k 5w 2k w k w 2k 2w 3k 3w k 2w k w k w k 2w 3k w 2k 2w k w k}
#alias {towerofwar} {jog 8n 2e 3n on 8n j 2n j n h j n e h 5n j 2n 3j 2n j h n j 2n j n h j n 2j 5n e 9n 5e 5n 5e 10n 8e s e c u w}
#alias {whitecloak} {jog 6e 5s e 6s od d^go waygate^jog 3e n d 2n 5w s w u 3s d w s w s d w u w s w^go waygate^jog s e n 2e 2n 3e oe e 6n 6e n on 3n e 9n h 2n h e}


/*
#PATHDIR n n
#PATHDIR s s
#PATHDIR e e
#PATHDIR w w
#PATHDIR u u
#PATHDIR d d
#PATHDIR ne j
#PATHDIR nw h
#PATHDIR se l
#PATHDIR sw k

#ALIAS togglemap {
  #IF %mapflag(vtmap) {
    #map flag vtmap off;
    #unsplit;
    #show *** Map view disabled.;
  } {
    #split 16 1;
    #map flag vtmap on;
    #show *** Map view enabled.;
  }
}

#ALIAS mapinit {
  #map create 50000
  #split 30 1
  #map flag vtmap on
  #map goto 1
  #show *** New map created and started at room 1 with vertical split (map on right).
}

#ALIAS mapsave {
  #map write potp.map;
  #show *** Map saved to potp.map;
}

#ALIAS mapload {
  #map read myworld.map
  #map goto 1
  #show *** Map loaded and started at room 1.
}

*/
