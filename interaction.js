// This code uses a domino construction:
//  The domino sequence is described in each function's comment.
// 2016-03-16
// To use a state machine architecture, place a big task loop outside,
//  and code stop() and contnue() functions.
// 2016-03-21
// check browser support for all html elements: canvas is fine;
//  console is commented out, only for debugging.


//####################
//    configuration var
//####################
var STI_AREA_W = 300; //PX
var STI_AREA_H = 300; //px
var STI_RADIUS_MIN = STI_AREA_W/20; //px
var STI_RADIUS_MAX = STI_AREA_W/2 - STI_RADIUS_MIN; //px
var STI_ANGLE_MIN = 0; //deg
var STI_ANGLE_MAX = 150; //deg

var SCORE_BAR_W = 100; //px
var SCORE_BAR_H = 20; //px
var SCORE_THRESH = 0.10;//0.95;
var SCORE_MEMORY_MAX = 20

var MAX_TRAIN_TRIALS = 500; //ms
var MAX_TEST_TRIALS = 3;//30;
var MAX_CHECK_TRIALS = 2;//20;

var INSTRUCTION_WAIT_TIME = 3000; //ms
var FEEDBACK_WAIT_TIME = 1000; //ms


//####################
//    global var initialization
//####################
var training_trial = 1;
var test_trial = 1;
var check_trial = 1;

var spareRandom = null;

var log_start_time = new Date().getTime();
var log_end_time = new Date().getTime();

var score_memory = [];
for (i=0; i<SCORE_MEMORY_MAX; i++) {
  score_memory.push(0)
}


//####################
//    inputs
//####################
input_train = {radius: [], angle: [], truth: []};
input_test =  {radius: [], angle: [], truth: []};
input_check = {radius: [], angle: [], truth: []};
add_input_contents(input_train, MAX_TRAIN_TRIALS);
add_input_contents(input_test, MAX_TEST_TRIALS);
add_input_contents(input_check, MAX_CHECK_TRIALS);

function add_input_contents(in_array, max_trials) {
  var c, r, a;
  for (i=0; i<max_trials; i++) {
    c = randClass();
    r = randRadius(c);
    a = randAngle(c);
    in_array.truth.push(c);
    in_array.radius.push(r);
    in_array.angle.push(a);
  }
}

function randClass() {
  if (Math.random()>0.5){
    return "Beat"
  }
  else {
    return "Sonic"
  }
}

function randRadius(c) {
  var min, max, mid, mu, std;
  min = STI_RADIUS_MIN;
  max = STI_RADIUS_MAX;
  mid = (STI_RADIUS_MIN + STI_RADIUS_MAX)/2;
  if (c=="Beat") {
    mu =  mid + STI_RADIUS_MAX/4;
    std =  STI_RADIUS_MAX/12;
  } else if (c=="Sonic") {
    mu =  mid - STI_RADIUS_MAX/4;
    std =  STI_RADIUS_MAX/12;
  }
  return normalRandomInRange(mu, std, min, max);
  // return normalRandom(mu, std);
}

function randAngle(c) {
  var min, max, mid, mu, std;
  min = STI_ANGLE_MIN;
  max = STI_ANGLE_MAX;
  mid = (STI_ANGLE_MIN + STI_ANGLE_MAX)/2;
  if (c=="Beat") {
    mu =  mid;
    std =  STI_ANGLE_MAX/12;
  } else if (c=="Sonic") {
    mu =  mid;
    std =  STI_ANGLE_MAX/12;
  }
  return normalRandomInRange(mu, std, min, max);
  // return normalRandom(mu, std);
}

function normalRandomInRange(mean, std, min, max) {
  var s;
  do {
    s = normalRandom(mean, std)
  } while (s<min || s>max);
  return s
}

function normalRandom(mean, std) {
//Marsaglia polar method
	var val, u, v, s, mul;
	if(spareRandom !== null) {
		val = spareRandom;
		spareRandom = null;
	}
	else {
		do {
			u = Math.random()*2-1;
			v = Math.random()*2-1;
			s = u*u+v*v;
		} while(s == 0 || s >= 1);

		mul = Math.sqrt(-2 * Math.log(s) / s);
		val = u * mul;
		spareRandom = v * mul;
	}
	return mean + std*val
}

function test_input_stat() {
  var n = 10000;
  beat_radius_array = [];
  beat_angle_array = [];
  for (i=0; i<n; i++) {
    beat_radius_array.push(randRadius("Beat"));
    beat_angle_array.push(randAngle("Beat"));
  }
  sonic_radius_array = [];
  sonic_angle_array = [];
  for (i=0; i<n; i++) {
    sonic_radius_array.push(randRadius("Sonic"));
    sonic_angle_array.push(randAngle("Sonic"));
  }
  console.log("Length Beat radius array = %s", beat_radius_array.length)
  console.log("Mean Radius Beat = %s|%s",
    mean(beat_radius_array),
    (STI_RADIUS_MIN + STI_RADIUS_MAX)/2 + STI_RADIUS_MAX/4);
  console.log("Mean Radius Sonic = %s|%s",
    mean(sonic_radius_array),
    (STI_RADIUS_MIN + STI_RADIUS_MAX)/2 - STI_RADIUS_MAX/4);
  console.log("Mean Angle Beat = %s|%s",
    mean(beat_angle_array),
    (STI_ANGLE_MIN + STI_ANGLE_MAX)/2);
  console.log("Mean Angle Sonic = %s|%s",
    mean(sonic_angle_array),
    (STI_ANGLE_MIN + STI_ANGLE_MAX)/2);
  console.log("Std Radius Beat = %s|%s",
    std(beat_radius_array),
    STI_RADIUS_MAX/12);
  console.log("Std Radius Sonic = %s|%s",
    std(sonic_radius_array),
    STI_RADIUS_MAX/12);
  console.log("Std Angle Beat = %s|%s",
    std(beat_angle_array),
    STI_ANGLE_MAX/12);
  console.log("Std Angle Sonic = %s|%s",
    std(sonic_angle_array),
    STI_ANGLE_MAX/12);
}

function mean(in_array) {
  var n, s;
  n = in_array.length;
  s = 0;
  for (i=0; i<n; i++) {
    s += in_array[i];
  }
  return s/n;
}

function std(in_array) {
  var n, s, m;
  n = in_array.length;
  s = 0;
  m = mean(in_array);
  for (i=0; i<n; i++) {
    s += (in_array[i]-m)*(in_array[i]-m);
  }
  return Math.sqrt(s/(n-1));
}

//test_input_stat()


//####################
//    buttons & slider
//####################
start_button = $("<button>")
  .text("Start").click(function() {
    exp_start_time = new Date().getTime(); // log start time of experiment
    show_next_slide(slides)
    }
  )

submit_button = $("<button>")
  .text("Submit to Turk").click(function() {
    exp_end_time = new Date().getTime(); // log end time of experiment
    end_exp()
    }
  )

next_button = $("<button>").text("Next").
  click(function() {show_next_slide(slides)})

slider = $("<input id='rating_slider' type='range' \
  min='0' max='100' value='50'>")
  .click(function() {$("#rating_slide").append(rate_button)}
  )

rate_button = $("<button>").text("Rate").
  click(function() {
    rate_end_time = new Date().getTime();
    user_rating = $("#rating_slider").val();
    show_next_slide(slides)
  }
)


//####################
//    slides
//####################
slides = [];
slides.unshift({ name: "welcome", constructor: welcome_constructor});
slides.unshift({ name: "training", constructor: training_constructor});
//slides are added in training_trials_end until condition satisfied
slides.unshift({name: "training_trial",
  constructor: training_trials_constructor});
slides.unshift({ name: "test", constructor: test_constructor});
for (i=0; i<MAX_TEST_TRIALS; i++){
  slides.unshift(
    {name: "test_trial", constructor: test_trials_constructor}
  )
}
slides.unshift({ name: "check", constructor: check_constructor});
for (i=0; i<MAX_CHECK_TRIALS; i++){
  slides.unshift(
    {name: "check_trial", constructor: check_trials_constructor}
  )
}
slides.unshift({ name: "rating", constructor: rating_constructor});
slides.unshift({ name: "survey", constructor: survey_constructor});

//####################
//    start domino!!
//####################
// console.log("Hello, World!") //debug tool!!
exp = {data: []}
show_next_slide(slides)

function show_next_slide(slides) {
  $( ".slide" ).remove()
  next_slide = slides.pop()
  next_slide.constructor()
}

//####################
//    functions in sequence
//####################
function welcome_constructor() {
  slide = $("<div class='slide' id='welcome_slide' >")
  text = $("<div class='block-text' id='welcome_text'>")
  text.append($("<p>").html("In this experiment, we're interested in how \
    people interact with recommender systems. The experiemnt has four \
    parts: \
    First, you will do a classification task to learn what kind of \
    &#34antennas&#34 receive from which music station. \
    Second, you will interact with a recommender system. \
    Third, we will check if you still remember how the antenna works. \
    Finally, you will rate how well you think the recommender system did. \
    The whole experiment will take about 10 minutes."))
  text.append($("<p>").html("(Note: you won't be able to preview this \
    HIT before accepting it.)"))
  text.append($("<p>").html("By answering the following questions, you \
    are participating in a study being performed by cognitive scientists \
    in the Department of Mathmematics & Computer Science at Rutgers \
    University. If you have questions about this research, please contact \
    us at cocoscishafto@gmail.com. \
    You must be at least 18 years old to participate. \
    Your participation in this research is voluntary. You may decline to \
    answer any or all of the following questions. You may decline further \
    participation, at any time, without adverse consequences. Your \
    anonymity is assured; the researchers who have requested your \
    participation will not receive any personal information about you."))
  text.append($("<p>").html("We have recently been made aware that your \
    public Amazon.com profile can be accessed via your worker ID if you \
    do not choose to opt out. If you would like to opt out of this \
    feature, you may follow instructions available <a href =\
    'http://www.amazon.com/gp/help/customer/display.html?nodeId=16465241'\
    > here.  </a>"))
  text.append($("<p>").html("Please proceed with the Start button \
    after you have read the instructions."))
  slide.append(text)
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
  welcome_destructor()
}

function welcome_destructor() {
// waits a bit, shows start button
// button triggers show_next_slide, calls training_constructor
  if (turk.previewMode == false) {
    setTimeout(function() {
      $("#welcome_text").append($("<p>").append(start_button))},
      INSTRUCTION_WAIT_TIME
    )
  }
}

function training_constructor() {
// next button triggers training_trials_constructor
  training_start_time = new Date().getTime();
  slide = $("<div class='slide'>")
  text = $("<div class='block-text'>")
  text.append($("<p>").html('In this first part, \
    you will see "loop antennas" that received signals from one of two \
    music stations (Beat or Sonic). The station received depended on the \
    antenna&#39s overall radius and the orientation of an inner line. \
    Note that these antennas are sometimes noisy and can occastionally \
    receive from the wrong station.'))
  text.append($("<p>").html('The goal here is to learn what kind of \
    antennas most often receive from which station. After an antenna is\
    displayed, you should respond by either clicking on the \
    corresponding station, or by using the keyboard \
    ("z" for Beat and "m" Sonic). Upon responding, you will \
    receive a feedback on correctness. \
    You will advance to the next part once you can distinguish the \
    antennas with 95% accuracy.'))
  text.append($("<p>").html("Please click Next after you have read \
    through the instructions."))
  slide.append(text)
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
  if (turk.previewMode == false) {
    setTimeout(function() {
      slide.append(next_button)},
      INSTRUCTION_WAIT_TIME
    )
  }
}

function training_trials_constructor() {
// buttons/key press trigger training_feedback
  log_start_time = new Date().getTime() //bad form: storred in global var
  slide = $("<div class='slide' id='training_slide' >")
  text = $("<div class='block-text' id='training_text'>")
  table = $("<table align='center'>")
  row_score_bar = $("<tr align='center'>")
  row_stimulus_area = $("<tr align='center'>")
  row_buttons = $("<tr align='center'>")
  score_bar = $("<canvas id='score' align='center'>")
  stimulus_area = $("<canvas id='stimulus' align='center'>")
  row_score_bar.append(score_bar)
  row_stimulus_area.append(stimulus_area)
  // response by button press
  row_buttons.append(
      $("<button class='btn btn-default beat' value='Beat'>")
        .text('Beat (z)')
        .one("click", function() {training_feedback($(this))}),
      $("<button class='btn btn-default sonic' value='Sonic'>")
        .text('Sonic (m)')
        .one("click", function() {training_feedback($(this))})
  )
  table.append(
      row_score_bar,
      row_stimulus_area,
      row_buttons
  )
  text.append(
    $("<p>").html("The Next button will appear once you reach "
      + 100*SCORE_THRESH + "% in score. You will have a maximimum of "
      + MAX_TRAIN_TRIALS + " trials to accomplish this. (Trial "
      + training_trial + ")" ),
    table
  )
  slide.append(text)
  $("body").append(slide)
  // response by key press
  $(window).on("keypress", function (event) {
    if (exp.training_complete) { return }
    if (event.which == 122) {training_feedback($("button.beat"))}
    if (event.which == 109) {training_feedback($("button.sonic"))}
  })
  r = input_train.radius[training_trial-1];
  a = input_train.angle[training_trial-1];
  $(document).ready(function(){draw_score_bar()})
  $(document).ready(function(){draw_stimulus(r, a)})
  $(".slide").hide()
  slide.show()
}

function draw_score_bar() {
  var c = document.getElementById("score");
  var ctx = c.getContext("2d");
  //set canvas size
  c.width = SCORE_BAR_W
  c.height = SCORE_BAR_H
  // draw bar
  ctx.beginPath();
  ctx.rect(0, 0, SCORE_BAR_W, SCORE_BAR_H);
  ctx.fillStyle = 'red';
  ctx.fill();
  // fill bar
  frac = fraction_score(score_memory);
  ctx.beginPath();
  ctx.rect(0, 0, frac*SCORE_BAR_W, SCORE_BAR_H);
  ctx.fillStyle = 'green';
  ctx.fill();
  //show score as text
  ctx.fillStyle = 'white';
  ctx.font = 0.8*SCORE_BAR_H + "px Arial";
  ctx.fillText(frac*100 + "%",
    SCORE_BAR_W/2, SCORE_BAR_H - 0.1*SCORE_BAR_H);
}

function fraction_score(score_memory) {
  frac = 0;
  for (i=0; i<score_memory.length; i++){
    frac += score_memory[i]; // score_memory is global
  }
  frac = frac/SCORE_MEMORY_MAX;
  return frac
}

function draw_stimulus(radius, angle) {
  var c = document.getElementById("stimulus");
  var ctx = c.getContext("2d");
  //set canvas size
  c.width = STI_AREA_W
  c.height = STI_AREA_H
  // fill background
  ctx.beginPath();
  ctx.rect(0, 0, STI_AREA_W, STI_AREA_H);
  ctx.fillStyle = '#d3d3d3';
  ctx.fill();
  //draw circle
  ctx.beginPath();
  ctx.arc(STI_AREA_W/2, STI_AREA_H/2, radius, 0, 2*Math.PI);
  ctx.stroke();
  //draw line segment
  a = angle/180*Math.PI; //deg to rad
  dx = radius*Math.cos(a);
  dy = -radius*Math.sin(a);
  xi = STI_AREA_W/2 + dx;
  yi = STI_AREA_H/2 + dy;
  xf = STI_AREA_W/2 - dx;
  yf = STI_AREA_H/2 - dy;
  ctx.beginPath();
  ctx.moveTo(xi,yi);
  ctx.lineTo(xf,yf);
  ctx.stroke()
}

function training_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  log_end_time = new Date().getTime();
  choice = click_event.val();
  truth = input_train.truth[training_trial-1];
  score_memory.shift();
  if (choice == truth) {
    score_memory.push(1)
    slide.append($("<p class='feedback-text'>").
      html(`Correct`).css("color", "green"))
  } else {
    score_memory.push(0)
    slide.append($("<p class='feedback-text'>").
      html(`Incorrect`).css("color", "red"))
  }
  log_trial_data("training", training_trial,
    input_train, choice, log_start_time, log_end_time);
  // add slides
  training_trial += 1;
  frac = fraction_score(score_memory);
  training_trials_end(frac, training_trial);
}

function log_trial_data(name, ind, in_arr, choice, ti, tf) {
// bad form
  trial_data = {
    trial_type: name,
    trial_number: ind,
    response: choice,
    answer: in_arr.truth[ind-1],
    stimulus_radius: in_arr.radius[ind-1],
    stimulus_angle: in_arr.angle[ind-1],
    trial_start_time: ti,
    trial_end_time: tf,
    trail_time: tf - ti
  }
  exp.data.push(trial_data)
}

function training_trials_end(score, ind) {
// next slide goes back to training_trials_constructor
  if (score >= SCORE_THRESH) {
    setTimeout(function() {training_destructor()},
      FEEDBACK_WAIT_TIME)
  } else if (ind < MAX_TRAIN_TRIALS) {
    // console.log("slides length = %s", slides.length)
    slides.push({name: "training_trial",
      constructor: training_trials_constructor})
    // console.log("slides length = %s", slides.length)
    setTimeout(function() {show_next_slide(slides)},
      FEEDBACK_WAIT_TIME);
  } else if (ind == MAX_TRAIN_TRIALS) {
    setTimeout(function() {warning_constructor()},
      FEEDBACK_WAIT_TIME)
  }
}

function training_destructor() {
// next_button triggers show_next_slide
  training_end_time = new Date().getTime();
  if (turk.previewMode == false) {
      $("#training_slide").append($("<p>").append(next_button))
  }
}

function warning_constructor() {
  slide = $("<div class='slide'>")
  slide.append($("<p>").html("Warning!!!"))
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
}

function test_constructor() {
// next button triggers test_trials_constructor
  test_start_time = new Date().getTime();
  slide = $("<div class='slide'>")
  text = $("<div class='block-text'>")
  text.append($("<p>").html('In this part of the experiment, \
    pretend that you like the <b>Beat</b> better. \
    You are going to train the recommender system by telling it if the \
    antenna it chose will receive from the station that you like \
    (that&#39s the Beat). \
    You can do this this either by clicking the "Like" or "Dislike" \
    button, or by using the keyboard \
    ("z" for Like and "m" for Dislike). \
    While you are trianing the system, pleases also pay attention to \
    how well it is performing over time. You will be asked to rate \
    the system at the end.'))
  text.append($("<p>").html("Please click Next after you have read \
    through the instructions."))
  slide.append(text)
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
  if (turk.previewMode == false) {
    setTimeout(function() {
      slide.append(next_button)},
      INSTRUCTION_WAIT_TIME
    )
  }
}

function test_trials_constructor() {
// buttons/key press trigger test_feedback
  log_start_time = new Date().getTime() //bad form: storred in global var
  slide = $("<div class='slide' id='test_slide' >")
  text = $("<div class='block-text' id='test_text'>")
  table = $("<table align='center'>")
  row_stimulus_area = $("<tr align='center'>")
  row_buttons = $("<tr align='center'>")
  stimulus_area = $("<canvas id='stimulus' align='center'>")
  row_stimulus_area.append(stimulus_area)
  // response by button press
  row_buttons.append(
      $("<button class='btn btn-default like' value='Like'>")
        .text('Like (z)')
        .one("click", function() {test_feedback($(this))}),
      $("<button class='btn btn-default dislike' value='Dislike'>")
        .text('Dislike (m)')
        .one("click", function() {test_feedback($(this))})
  )
  table.append(
      row_stimulus_area,
      row_buttons
  )
  text.append(
    $("<p>").html("Please remember to pretend that you like the \
      <b>Beat</b>. The Next button will \
      appear once you finish all the trials. (Trials " + test_trial
       + "/" + MAX_TEST_TRIALS + ")"),
    table
  )
  slide.append(text)
  $("body").append(slide)
  // response by key press
  $(window).on("keypress", function (event) {
    if (exp.training_complete) { return }
    if (event.which == 122) {test_feedback($("button.like"))}
    if (event.which == 109) {test_feedback($("button.dislike"))}
  })
  r = input_test.radius[test_trial-1];
  a = input_test.angle[test_trial-1];
  $(document).ready(function(){draw_stimulus(r, a)})
  $(".slide").hide()
  slide.show()
}

function test_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  log_end_time = new Date().getTime();
  choice = click_event.val();
  log_trial_data("test", test_trial,
    input_test, choice, log_start_time, log_end_time);
  test_trial += 1;
  test_trials_end(test_trial);
}

function test_trials_end(x) {
// next slide goes back to test_trials_constructor
  if (x <= MAX_TEST_TRIALS) {
    setTimeout(function() {show_next_slide(slides)},
      FEEDBACK_WAIT_TIME)
  }
  else {
    setTimeout(function() {test_destructor()},
      FEEDBACK_WAIT_TIME)
  }
}

function test_destructor() {
// next_button triggers show_next_slide
  test_end_time = new Date().getTime()
  if (turk.previewMode == false) {
      $("#test_slide").append($("<p>").append(next_button))
  }
}

function check_constructor() {
// next button triggers check_trials_constructor
  check_start_time = new Date().getTime();
  slide = $("<div class='slide'>")
  text = $("<div class='block-text'>")
  text.append($("<p>").html("Before you rate the recommender system, \
    we just want to see if you still remember how the antenna works. \
    This is the same as the first part of the experiment, except that \
    you will not be given feedback. There will a total of "
    + MAX_CHECK_TRIALS + " trials."))
  text.append($("<p>").html("Please click Next after you have read \
    through the instructions."))
  slide.append(text)
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
  if (turk.previewMode == false) {
    setTimeout(function() {
      slide.append(next_button)},
      INSTRUCTION_WAIT_TIME
    )
  }
}

function check_trials_constructor() {
// buttons/key press trigger check_feedback
  log_start_time = new Date().getTime() //bad form: storred in global var
  slide = $("<div class='slide' id='check_slide' >")
  text = $("<div class='block-text' id='check_text'>")
  table = $("<table align='center'>")
  row_stimulus_area = $("<tr align='center'>")
  row_buttons = $("<tr align='center'>")
  stimulus_area = $("<canvas id='stimulus' align='center'>")
  row_stimulus_area.append(stimulus_area)
  // response by button press
  row_buttons.append(
      $("<button class='btn btn-default beat' value='Beat'>")
        .text('Beat (z)')
        .one("click", function() {check_feedback($(this))}),
      $("<button class='btn btn-default sonic' value='Sonic'>")
        .text('Sonic (m)')
        .one("click", function() {check_feedback($(this))})
  )
  table.append(
      row_stimulus_area,
      row_buttons
  )
  text.append(
    $("<p>").html("The Next button will \
      appear once you finish all the trials. (Trials " + check_trial
       + "/" + MAX_CHECK_TRIALS + ")"),
    table
  )
  slide.append(text)
  $("body").append(slide)
  // response by key press
  $(window).on("keypress", function (event) {
    if (exp.training_complete) { return }
    if (event.which == 122) {check_feedback($("button.beat"))}
    if (event.which == 109) {check_feedback($("button.sonic"))}
  })
  r = input_check.radius[check_trial-1];
  a = input_check.angle[check_trial-1];
  $(document).ready(function(){draw_stimulus(r, a)})
  $(".slide").hide()
  slide.show()
}

function check_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  log_end_time = new Date().getTime();
  choice = click_event.val();
  log_trial_data("check", check_trial,
    input_check, choice, log_start_time, log_end_time);
  check_trial += 1;
  check_trials_end(check_trial);
}

function check_trials_end(x) {
// next slide goes back to check_trials_constructor
  if (x <= MAX_CHECK_TRIALS) {
    setTimeout(function() {show_next_slide(slides)},
      FEEDBACK_WAIT_TIME)
  }
  else {
    setTimeout(function() {check_destructor()},
      FEEDBACK_WAIT_TIME)
  }
}

function check_destructor() {
// next_button triggers show_next_slide
  check_end_time = new Date().getTime()
  if (turk.previewMode == false) {
      $("#check_slide").append($("<p>").append(next_button))
  }
}

function rating_constructor() {
//Rate button triggers show_next_slide
  rate_start_time = new Date().getTime();
  slide = $("<div class='slide' id='rating_slide' >")
  text = $("<div class='block-text' id='rating_text'>");
  text.append($("<p>").html('Please rate how you think \
    the recommender system did by adjusting the slide bar. \
    Then click "Rate" to submit the rating and proeed to the survey.'))
  text.append(slider)
  text.append($("<p>").html('<span style="float:left">Very poor</span>\
    <span style="float:right">Excellent</span>'))
  text.append($("<p>").html("<br>"))
  slide.append(text)
  $("body").append(slide)
  //console.log("rating value = %s", $("#rating_slider").val())
  $(".slide").hide()
  slide.show()
}

function survey_constructor() {
// submit button triggers end_exp
  slide = $("<div class='slide' id='survey_slide' >")
  text = $("<div class='block-text' id='survey_text'>");
  text.append($("<p>").html("Thank you for taking our HIT. \
    Please answer the following questions."))
  text.append($("<p>").html('What was this experiment about? <br> \
    <input type="text" id="about" name="about" size="70">'))
  text.append($("<p>").html('How can we make this experiment better? \
    <br> <input type="text" id="better" name="better" size="70">'))
  text.append($("<p>").html('Was anything unclear? <br> \
    <input type="text" id="unclear" name="unclear" size="70">'))
  text.append($("<p>").html('Did you use any external learning aids \
    (e.g. pencil and paper)? <br> \
    <input type="text" id="external_aid" name="external_aid" size="70">'))
  text.append($("<p>").html('Did you use any particular strategy \
    to learn the relationship between antennas and stations? <br> \
    <input type="text" id="strategy" name="strategy" size="70">'))
  text.append($("<p>").html('Any other comments for us? \
  <br> <input type="text" id="comments" name="comments" size="70">'))
  text.append($("<p>").html('What is your age? <br> \
    <input type="text" id="age" name="age" size="20">'))
  text.append($("<p>").html('What is your gender? \
    (m = male, f = female, o = other) <br> \
    <input type="text" id="gender" name="gender" size="20">'))
  text.append(submit_button)
  slide.append(text)
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
}

function end_exp() {
  // check survey data,then submit exp to turk
  if ($('#about').val().length != 0) {
    slide = $("<div class='slide' id='submit' >")
    text = $("<div class='block-text' id='submit_text'>")
    text.append($("<p>").html("You're submit - thanks for " +
      "participating! Submitting to Mechanical Turk..."))
    slide.append(text)
    $("body").append(slide)
    $(".slide").hide()
    slide.show()
    // store survey data
    exp.about = $('#about').val();
    exp.better = $('#better').val();
    exp.unclear = $('#unclear').val();
    exp.comment = $('#comments').val();
    exp.external_aid = $('#external_aid').val();
    exp.strategy = $('#strategy').val();
    exp.age = $('#age').val();
    exp.gender = $('#gender').val();
    exp.turkSubmitTo = turk.turkSubmitTo;
    exp.user_rating = user_rating;
    exp.exp_start_time = exp_start_time;
    exp.training_start_time = training_start_time;
    exp.training_end_time = training_end_time;
    exp.test_start_time = test_start_time;
    exp.test_end_time = test_end_time;
    exp.check_start_time = check_start_time;
    exp.check_end_time = check_end_time;
    exp.rate_start_time = rate_start_time;
    exp.rate_end_time = rate_end_time;
    exp.exp_end_time = exp_end_time;
    // submit to turk
    setTimeout(function() {turk.submit(exp)}, 500)
  }
  else {
    text.append($("<p style='color:red'>").html('Please answer the \
      first question before submtting.'))
  }
}
