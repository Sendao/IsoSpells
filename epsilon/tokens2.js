let thesaurus = require('./thesaurus.js');
let sentiments = require('./sentiments.js');

function alphaSentiment(word) {
  var i;
  var vowels = ['e','a','i','o','u','y','h','s','w'];
  let consonants = ['b','c','d','f','g','j','k','l','m','n','p','q','r','t','v','x','z'];
  let alphaScores = {
    a: 2, b: 3, c: 3, d: -4, e: 3, f: 0, g: 0, h: 5, i: 3, j: 0, k: 1, l: 5, m: -6, n: 3, o: 7, p: 8, q: 9, r: 2, 
    s: -4, t: -3, u: -6, v: -4, w: 8, x: -3, y: -2, z: -5,
    0: 0, 1: 3, 2: 2, 3: 6, 4: -3, 5: 3, 6: -1, 7: -8, 8: 4, 9: 5
  };
  var score=0;
  var wl = word.toLowerCase();
  for( i = 0; i < word.length; i++ ) {
    if( !(wl[i] in alphaScores) ) {
      score++;
      continue;
    }
    score += alphaScores[wl[i]];
  }
  if( score == 0 || word.length == 0 /*?*/ /*who knows, these days..*/ ) return 0;
  score/=word.length;
//  console.log(word,score);
  return score;
}

function getSentiment(phrase)
{
	var words = splitWords(phrase);
	let sent = 0;
	for( var i=0; i<words.length; i++ ) {
		if( words[i] in sentiments ) {
			let s = sentiments[words[i]];
			sent += 100*(s[0] + s[1] - s[2]) / words.length;
		} else {
			sent += 100*(alphaSentiment(words[i])) / words.length; // consider using cofactors here.
		}
	}
	return sent;
}
function sortSentiments( sentimentList )
{
	sentimentList.sort( (a,b) => { getSentiment(a) - getSentiment(b) } );
	return sentimentList;
}
function getThesaurus(phrase)
{
	let words = splitWords(phrase);
	if( words.length > 1 || !(phrase in thesaurus) ) return [];
	let result = [];
	for( var i in thesaurus[phrase] ) {
		result.push(i);
	}
	return result;
}
function sortPatterns( patternList )
{
	var x = [];
	var found = new Set();
	for( var i=0; i<patternList.length; i++ ) {
		if( found.has(patternList[i]) ) continue;
		found.add(patternList[i]);
		x.push( patternList[i] );

		let these = getThesaurus(patternList[i]);
		for( var j=0; j<these.length; j++ ) {
			found.add( these[j] );
		}
	}
	return x;
}

function splitWords(phrase)
{
	var i;
	var w = "";
	let words = [];

	for( i=0; i<phrase.length; i++ ) {
		if( letterType(phrase[i]) != 0 ) {
			if( w != "" ) {
				words.push(w);
				w = "";
			}
			if( phrase[i] != ' ' )
				w += phrase[i];
		} else {
			w += phrase[i];
		}
	}
	if( w != "" ) words.push(w);

	return words;
}

let cc = {
	a: 'a'.charCodeAt(0), z: 'z'.charCodeAt(0),
	A: 'A'.charCodeAt(0), Z: 'Z'.charCodeAt(0),
	zero: '0'.charCodeAt(0), nine: '9'.charCodeAt(0)
};
function letterType( c  )
{
	let n = c.charCodeAt(0);
	if( ( n >= cc.a && n <= cc.z ) || ( n >= cc.A && n <= cc.Z ) )
		return 0;
	if( n >= cc.zero && n <= cc.nine )
		return 1;
	if( c == ' ' || c == '\n' || c == '\r' || c == '\t' )
		return 2;
	return 3;
}
function tokenize1( str )
{
	var i,t;
	let w="",tokens=[];
	let type=-1;

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					tokens.push(w);
					w = "";
				}
			case 0:
				w += str[i];
				break;
			case 2:
				w = " ";
				break;
			}
			continue;
		} else {
			if( w != "" )
				tokens.push(w);
			type=t;
			w=str[i];
		}
	}
	if( w != "" )
		tokens.push(w);

	let final = [];
	let dupes = new Set();
	for( i=0; i<tokens.length; i++ ) {
		if( tokens[i] == ' ' ) continue;
		if( dupes.has(tokens[i]) ) continue;
		dupes.add(tokens[i]);
		final.push(tokens[i]);
	}

	return final;
}
function tokenize2( tkin )
{
	var i, t;
	let used = new Set(), found = new Set();
	let mode=-1;
	let phrase="";
	let tokens = {};
	let tokenId = 0;

	for( i=0; i<tkin.length; i++ ) {
		if( used.has( tkin[i] ) ) {
			if( !found.has( tkin[i] ) ) {
				found.add( tkin[i] );
			}
		} else {
			used.add( tkin[i] );
		}
	}
	for( i=0; i<tkin.length; i++ ) {
		if( !found.has(tkin[i]) ) { // word is unique
			if( mode == 0 ) {
				phrase = joinWord(phrase, tkin[i]);
			} else {
				phrase = tkin[i];
				mode=0;
			}
		} else {
			if( mode != 1 && phrase != "" ) {
				tokens[phrase] = tokenId++;
			}
			mode=1;
			if( tkin[i] in tokens ) continue; // already denumerated
			tokens[tkin[i]] = tokenId++;
		}
	}

	var result = new Array( Object.keys(tokens).length );
	for( var w in tokens ) {
		result[ tokens[w] ] = w;
	}
	return result;
}

function joinWord(phrase, word1)
{
	let t = letterType(word1[0]);
	let u = letterType(phrase[phrase.length-1]);
	let includeSpace=true;
	if( u == 2 ) includeSpace=false;
	switch( t ) {
	case 0: // alphabet
		return phrase + (includeSpace?" ":"") + word1;
	case 1: // numeric
		if( u == 1 ) return phrase + word1;
		else return phrase + (includeSpace?" ":"") + word1;
	case 2: // spacing
		return phrase + (includeSpace?" ":"");
	case 3: // punctuation
		if( word1 == "-" ) {
			return phrase + (includeSpace?" ":"") + "-";
		} else {
			if( !includeSpace ) return phrase.substring(0, phrase.length-1) + word1;
			else return phrase + word1;
		}
	}
	return phrase + " " + word1;
}


function toTokens( str )
{
	var i,t;
	let w="",tokens=[];
	let type=-1;
	if( str == "" ) return [];

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					tokens.push(w);
					w = "";
				}
			case 0:
				w += str[i];
				break;
			case 2:
				break;
			}
		} else {
			if( w != "" ) {
				tokens.push(w);
				w = "";
			}
			type=t;
			if( t != 2 )
				w += str[i];
		}
	}
	if( w != "" )
		tokens.push(w);

	let buf = "";
	let result = [];
	for( var i=0; i<tokens.length; i++ ) {
		if( buf != "" && buf in dict ) {
			result.push( dict[buf] );
			buf = "";
		}
		if( buf != "" && buf in thesaurus ) {
			let x = getThesaurus(buf);
			for( var j=0; j<x.length; j++ ) {
				if( x[j] in dict ) {
					result.push( dict[x[j]] );
					break;
				}
			}
			buf="";
		}
		if( buf == "" ) buf = tokens[i];
		else buf = joinWord(buf, tokens[i]);
	}
	if( buf in dict ) {
		result.push( dict[buf] );
		buf = "";
	}
	if( buf != "" )
		console.log("Overflow: " + buf);
	return result;
}


let corpus = `
0 1 2 3 4 5 6 7 8 9
0 1 2 3 4 5 6 7 8 9
When you walk down the street, and see an intersection up ahead, you can decide to turn right or left at the intersection. When your feet arrive at the intended destination, if you simply allow them, they will travel through as preset.

This same simple technique is extensible to many tasks and provides additional cues for your body that you don’t even think about or notice. Your breathing changes slightly to accommodate for the distance you are preparing to walk, your heart and brain make changes to what you feel and perceive on your journey, even your digestive enzymes and your DNA begin to react to these informative plans for your future. 

With all of this in mind you can shape your future with great precision, ease, and clarity. In preparing to relax a part of your body and telling yourself for how long you will sit in meditation, you give your body and mind useful subconscious clues about the framing of time, the spacing of intervals, the valuable distractions and other perceptual challenges and boundaries you may face, and you prepare reactions to each set of circumstances you predict will arise.

In the beginning, or really somewhat after it, you are only using the ancestral codes of humanity you have picked up. But as you progress you make refinements, changes slight and large to the code that you will continue sharing in a constant exchange with the universe. Your slight gestures will paint the sky and set it on fire with the buzzing of interaction. Your plans will blow up into magnificent dis-asters: God will be larger than anything you know. But with each explosion you will identify more and more of the scientifically rigorous cofactors, the rides you can take, the frames of mind you can carry, interrupts and bindings for situations and people – some appropriate and some probably not as much so. Ok, you get the idea… I’m off to watch some more TV *programmed zombie gaze*
 

So what of Love? Love is an intricate dance, a beautiful romance, a melting and
melding of two worlds together into one glorious expansion that enriches both
lives and has the cosmic power to create new ones. First it creates the unified
life of the two lovers: the life they live together. Then it enriches their
individual lives, and the lives of everyone around them benefit as well. And, in
the penultimate(yes I’m using the right word) climax of combined magical power,
it creates a baby, a life that is so fragile and new that it requires nine
months just to figure out how to breathe.

 

So just how much ‘testing’ should we put someone through before we let them into
our zone of trust? Testing is a major turnoff for just about everybody. What if
you do the wrong thing? What if you step the wrong way? What if you screw up the
dance and the love of your life walks away from you?

 


And both minds are RIGHT!~ That’s what I’m trying to get at here. You don’t have
to be afraid of everyone, you don’t have to avoid, or test, or verify… you can
just let it be. You can just melt together. Because when you do, the lessons
come. And they can be of two natures. One nature is harsh, unyielding, forceful.
The other nature is graceful, allowing, accepting without even having to try.

 

Maybe you will get tied into a bad, abusive relationship, maybe for years and
years and years. Maybe you will lose the chance to meet an extremely attractive,
rich, vigorous, fruitful partner because you are too busy getting abused by some
loser who seduced you in a bar while you were drunk. It happens! But if it does
happen, it happens, like everything else, for a reason. It happens to teach you
the lessons that you need to learn. For example, how not to stay in an abusive,
horrible, dictatorial relationship with someone who doesn’t have your best
interests at heart.

 
 

The truth is that we (men and women) are REALLY REALLY GOOD at taking tests that
we don’t care about. And when it’s something really important, when that man or
woman is the most important thing in the world to us, it is almost IMPOSSIBLE to
take the test. Are you getting it now? Testing = abuse. Stop testing! Enjoy
yourself! Free love! Stop with the psychotic hating, that’s no way to get
yourself into a good relationship! 🙂

 

Instead, *start* by allowing, accepting naturally, being graceful, … if there
is abuse, what form does it take? Is it a mirror of something that has happened
in your past? Sometimes we invite abuse, sometimes (in limitted form) it is
healthy and it is helping us to address old wounds. So be careful: don’t go
asking “is this guy going to treat me like all the other guys have?” Because you
are creating a pattern and if he really loves you, he will FALL RIGHT INTO IT
just to help you, just to give you a chance to get OUT of it!

 

Allow. Breathe. Inhale. Let the man or woman of your dreams be themselves, and
find out who they are. Go forth curiously, find out what they are. Let yourself
see their weaknesses. Let them bring forth your fears and your trusts, let them
be all that they can be. And be yourself as well. Lose yourself in them, breathe
everything about them in, become helplessly dependent on them, but simply always
remember that they are separate. They are not you. In this way, I promise you
that they will be unable to control you. In this way, they will be unable to
hurt you. As a student of their love, you will discover your own weaknesses, you
will find that your own faults complement something in them – no matter who or
what they are – because all two people are soul mates, all two people can be
together, and all two people are beautiful.

Our subconscious is available to us through filters that focus the attention and inspire the imagination. These filters are muses, as when the attention is focused, creativity is driven by the knowledge that carries on within us.

An infinite library is accessible to your pen.

All it takes is a slight shift of intention, a desire and a will to set the remembrance of known reality on a new course that is the sound of your thoughts exploding through the space of connections between neurons and thinkers, quantum waves looping through cyclical pattern buffers, being sorted and translated and related to. The driven focus allows for a single idea to dominate and bring out its essence through a reiteration of core topics. Here’s a simple analogy: intention is to focus as velocity is to movement. When you set your intention, your focus follows along with it.

The paragraphs flow like water through the body as the pen presses against the paper and the ideas transform under the responding pressure of the will,

The story and its characters are yours, the gift of the simple choice of focus, the choice that is always your right to have without interruption – well, within limits of course, ha ha ha! Focus can always come and go, it flows like a reed in the wind and returns to its center when all is made calm. The world is strange but it has its moments.

My pen is lately making topical lists and expanded concept charts. My keyboard really needs to be making my C# bot’s web control panel, and not wandering off on some adventure to the meta-land of the akashic records. Hope you have a great day!

Consider a fabric of nodes which equalize gravitational attraction in varying different directions. Each node is composed of a series of translational mechanics (capable of translating gravity from one direction to another) and a form of memory and messaging which perceives gravitational pulls and dictates appropriate responses.

Now, what happens when gravity on a particular node exceeds its translational capabilities? This node would be ‘pulled’ out of its fabric, (though it could then be replaced with a duplicate node),creating a hole, (a singularity if you will, although often such gravities would most likely affect large portions of fabric – thus creating a rip or tear, all of which would need to be severed from the original fabric and replaced with origin material .. but the old material would still exist, translated in dimensional space according to the over-taxed but nonetheless coping mechanisms of the host nodes). If you remember that gravitational affects exist not only in the three dimensions we are aware of but also in at least the dimensions of time and interpersonal connection, this can lead to some rather startling space-separated anomalies and their perhaps partial reconnection to said fabric.

So you have all this self-correcting fabric of nodes, and one of them might tear out at any time. However, some of these nodes are capable of targetted high-frequency oscillative correction. These nodes can communicate and focus geometrically calculated oscillations through varying frequencies of vibration, which create ripples through the rest of the fabric, stabilizing a particular directional axis in general or n-triangulating their efforts to assist or inhibit a particular node’s traversal through space.

These ‘harmonic oscillators’ manage many forms of support for this antigravity fabric, but alone are not enough. The fabric also contains a plethora of other processes, from primitive to sentient and beyond, for purposes of energy storage and usage, computation and processing, and much more. The harmonic oscillators (in all likelihood these are entire groupings of nodes which have their own multi-fabric structure and internal processes to handle) in particular amuse me because of their intuitive mathematical processes, relying on the feedback-inducing time/space oscillation of connections in the fabric to direct support to other nodes.

 

Thanks for listening!

We all have a protective castle we go to, to be alone or with our loved ones, to deal with our problems without any distractions. However, this internalized castle can be a hindrance when we are not able to access it.

It is so easy for anyone to brush away our castle with any negative thoughts or contradictory statements. Someone simply saying “I don’t believe what you are sharing with me” can completely disintegrate your need to help them and your own belief in the power of what you are doing. Simply listening to someone who doesn’t want you to be in your castle can blow the castle away, because you have to leave that castle to hear their words – the subconscious power of their own desires is quite strong if you open to them at all, which you may have to do for purposes of work or family or just maintaining relationships.

To that end I have been guided to develop access passageways (“tunnels of transformational trust”) into my castle, to allow every energy that comes toward me to travel through these tunnels and be transformed into the highest good that can come to me. Along these tunnels are detectors and transmutational elements and spinning discs. Each feature provides additional layers of support and routing – some energies will not make it all the way inside my castle, but will be routed around the outside, enervating defense systems and providing power for transmutational elements. Other energies are pooled and collected. When someone offers me an energy that I cannot accept from them, it goes into a pool, and from that pool it can be drawn to offer to another. When someone offers me an energy I don’t want, it does not destroy or invalidate my castle. It simply brings the energy into a special room with a mirror. The mirror reflects the energy back out of the castle, but through the mirror the energy is ‘handled’ – its polarity is shifted, its strong colors removed, its bright light dimmed to a tolerable and acceptable level. In this way, my castle goes with me everywhere I go, and is not a hindrance but a constant companion and protective tool. And from it I can draw upon infinite resources, the many planes of existence which we are able to find when we isolate ourselves in this way. However, I am not isolated – anyone can join me in my castle, though they may have to make an extra effort of trusting me in order to gain entry.

Posted in Uncategorized

Nervous Novice’s Guide to Meditation •March 26, 2012 • 1 Comment (Edit)
Meditation, or emptying the mind, is a fascinating tool that many people wish to learn. However, most people feel that they cannot stop the busying, distracting thoughts running through their heads. There is an alternative to the brute force approach of telling all the ideas to “go stuff it.”

An active meditation process allows resolutions to distracting thoughts to be achieved through the method of balancing the left and right sides of the body through simple observation. The process is simple and keeps the mind occupied while balancing the structure of the body, enhancing peace of mind, and promoting balance in the brain – balance between emotions(right brain) and logic(left brain), and between the details(left brain) and the abstract(right brain) or big picture.

To begin, just focus on your body. Observe the balance of left and right, and gently move your body to realign it. Balance the left and right sides as best you can, and make sure you have a good solid core structure. Explore on your own through the ways your body feels as you move it – this is your exploration, so discover it and follow it – you never know what secrets your body has to offer. Not only can self-observation and meditation clear your mind and give you a place a peace, it can also change the way people act around you, change the situations your world throws your way, and change the way you look at everything going on in your life. The more you study, the more you will find, and the more you examine, the more questions you will have. It is an infinite journey…

`;

let tokensToWords = tokenize1(corpus);

let primes = [];
function isPrime( x ) {
	var i;
	for( i=0; i<primes.length; i++ ) {
		if( (x % primes[i]) == 0 ) {
			return false;
		}
	}
	return true;
}

// convert tokens to prime numbers
let dict = {}, xdict = {};
let flavor = {}, xflavor = {};

let sentiment = sortSentiments(tokensToWords);
let pattern = sortPatterns(sentiment);

let primeMax = pattern.length;

var pr = 1;
for( var i=0; i<primeMax; i++ ) {
	do {
		pr++;
	} while( !isPrime(pr) );
	primes.push(pr);
}

/*
for( var i=0; i<primes.length; i++ ) {
	primes[i] /= 10000;
}*/

for( var i=0; i<pattern.length; i++ ) {
	dict[ pattern[i] ] = primes[i];
	xdict[ primes[i] ] = pattern[i];
	flavor[ sentiment[i] ] = primes[i];
	xflavor[ primes[i] ] = sentiment[i];
}

let tokens = toTokens(corpus);









/*






//console.log(dict);


let mchain1 = function(tokens,nexts={})
{
	var prev;

	prev = tokens[0];
	for( var i=1; i<tokens.length; i++ ) {
		if( !(prev in nexts) ) nexts[prev] = {};
		if( !(tokens[i] in nexts[prev]) ) nexts[prev][tokens[i]] = 1;
		else nexts[prev][tokens[i]]++;
		prev = tokens[i];
	}

	for( var i in nexts ) {
		let sum=0;
		let arr = nexts[i];
		for( var j in arr ) {
			sum += arr[j];
		}
		for( var j in arr ) {
			arr[j] = arr[j] / sum;
		}
	}

	return nexts;
}

let mchain2 = function(tokens,nexts)
{
	var prev, prev1, prev2;

	prev1 = tokens[0];
	prev2 = tokens[1];
	prev = prev1 + "," + prev2;
	for( var i=2; i<tokens.length; i++ ) {
		if( !(prev in nexts) ) nexts[prev] = {};
		if( !(tokens[i] in nexts[prev]) ) nexts[prev][tokens[i]] = 1;
		else nexts[prev][tokens[i]]++;
		
		prev1 = prev2;
		prev2 = tokens[i];
		prev = prev1 + "," + prev2;
	}

	for( var i in nexts ) {
		let sum=0;
		let arr = nexts[i];
		for( var j in arr ) {
			sum += arr[j];
		}
		for( var j in arr ) {
			arr[j] = arr[j] / sum;
		}
	}

	return nexts;
}



let mchain3 = function(tokens,nexts)
{
	var prev, prev1, prev2, prev3;

	prev1 = tokens[0];
	prev2 = tokens[1];
	prev3 = tokens[2];
	prev = prev1 + "," + prev2 + "," + prev3;
	for( var i=3; i<tokens.length; i++ ) {
		if( !(prev in nexts) ) nexts[prev] = {};
		if( !(tokens[i] in nexts[prev]) ) nexts[prev][tokens[i]] = 1;
		else nexts[prev][tokens[i]]++;
		
		prev1 = prev2;
		prev2 = prev3;
		prev3 = tokens[i];
		prev = prev1 + "," + prev2 + "," + prev3;
	}

	for( var i in nexts ) {
		let sum=0;
		let arr = nexts[i];
		for( var j in arr ) {
			sum += arr[j];
		}
		for( var j in arr ) {
			arr[j] = arr[j] / sum;
		}
	}

	return nexts;
}

let corpn = toTokens(corpus);
let data = {};
mchain1(corpn,data);
mchain2(corpn,data);
mchain3(corpn,data);

let nextword = function(w1,w2,w3)
{
	var x = "";
	if( typeof w1 != "undefined" ) x = w1 + ",";
	if( typeof w2 != "undefined" ) x += w2 + ",";
	x += w3;

	x = x.toLowerCase();

	var um;

	if( x in data ) {
		return data[x];
	} else if( typeof w1 != "undefined" ) {
		return nextword(um,w2,w3);
	} else if( typeof w2 != "undefined" ) {
		return nextword(um,um,w3);
	} else {
		var z = dict["the"];
		var q = {};
		q[z] = 1;
		return q;
	}
}

function nextof( nest )
{
	var t = 0;
	for( var i in nest ) {
		t += nest[i];
	}
	var x = Math.random()*t;
	var k = Object.keys(nest);
	for( var i in nest ) {
		x -= nest[i];
		if( x <= 0 ) return i;
	}
	return k[ k.length - 1 ];
}


var w1,w2,w3;
w1=w2="";
w3 = "the";
var w;
let buf = "The";
console.log("-");
for( var i=0; i<300; i++ ) {
	let t1 = toTokens(w1)[0];
	let t2 = toTokens(w2)[0];
	let t3 = toTokens(w3)[0];
	w = nextword(t1, t2, t3);
//	k = nextword("", t2, t3);
//	for( var j in k ) w[j] = k[j];
//	k = nextword("", "", t3);
//	for( var j in k ) w[j] = k[j];
	w = xdict[nextof(w)];
	console.log("W",w);
	w1=w2;
	w2=w3;
	w3=w;
	buf = joinWord(buf,w);
}
console.log(buf);
*/


