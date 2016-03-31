// This code uses a domino construction:
//  The domino sequence is described in each function's comment.
// 2016-03-16
// To use a state machine architecture, place a big task loop outside,
//  and code stop() and contnue() functions.
// 2016-03-21
// check browser support for all html elements: canvas is fine;
//  console is commented out, only for debugging.
// 2016-03-29
// some are called training, some are called train


// Differences between us and Markant & Gureckis:
//
// Their non-active training is just watching the stimuli with the label.
// We cannot do this because we have to measure the participants'
// performance in the training phase.
//
// They use 600 discrete steps for training, we use continuous values
//
// I think all their random samples used the true generatative label,
// while their non-random samples used the optimal-decision-rule label.
// So, I am using the true label.
//
// In their table 1, the smaller variance is 2000, which means achieving
// score_thresh = 0.95 is impossible.
// For this reason, we use 75 following Ashby 2002.
// In their setup, stimuli are shown for only 250ms.


//####################
//    configuration var
//####################
var STI_AREA_W = 300; //PX
var STI_AREA_H = 300; //px
var STI_MARGIN = 15; //px
var STI_RADIUS_MIN = STI_MARGIN + Math.random()*50; //px
var STI_RADIUS_MAX = STI_AREA_W/2 - STI_MARGIN; //px
var STI_ANGLE_MIN = Math.random()*30; //deg
var STI_ANGLE_MAX = STI_ANGLE_MIN + 150; //deg

var SCORE_BAR_W = 100; //px
var SCORE_BAR_H = 20; //px

var SCORE_THRESH = 0.95; //0.95;
var SCORE_MEMORY_MAX = 20;

var MAX_TRAIN_TRIALS = 500; //500;
var MAX_INTER_TRIALS = 20; //20;
var MAX_CHECK_TRIALS = 5*4; //should be multiples of 4;

var INSTRUCTION_WAIT_TIME = 3000; //ms
var FEEDBACK_WAIT_TIME = 1000; //ms

//####################
//    condition var
//####################
var SAMP_CAT_COND = randCond();
var PREFERENCE = randClass();

function randCond() {
// 2 sampling cond x 2 category cond = 4 conditions:
// SA means small std on angle, large std on radius
// SR means small std on radius, large std on angle
  var s_cond, c_cond;
  if (Math.random()>0.5) {
      s_cond = "SA";
  } else {
      s_cond = "SR";
  }
  if (Math.random()>0.5) {
      c_cond = "Beat";
  } else {
      c_cond = "Sonic";
  }
  return [s_cond, c_cond]
}

//####################
//    global var initialization
//####################
var training_trial = 1;
var inter_trial = 1;
var check_trial = 1;

var spareRandom = null;

var log_start_time = new Date().getTime();
var log_end_time = new Date().getTime();

var score_memory = [];
for (i=0; i<SCORE_MEMORY_MAX; i++) {
  score_memory.push(0)
}

//####################
//    continuous random inputs
//####################
input_train = {radius: [], angle: [], truth: []};
input_inter =  {radius: [], angle: [], truth: []};
add_input_contents(input_train, MAX_TRAIN_TRIALS);
add_input_contents(input_inter, MAX_INTER_TRIALS);

function add_input_contents(in_array, max_trials) {
  var c, r, a, s;
  var cond = SAMP_CAT_COND;
  var min_r, max_r, min_a, max_a;
  min_r = STI_RADIUS_MIN;
  max_r = STI_RADIUS_MAX;
  min_a = STI_ANGLE_MIN;
  max_a = STI_ANGLE_MAX;
  for (i=0; i<max_trials; i++) {
    c = randClass();
    if (cond[0] == "SR" && cond[1] == "Beat") {
      s = sampleSmallVar(min_r, max_r);
      a = sampleBigVar(min_a, max_a);
      if ( c == "Beat" ) {
        r = s - 40;
      } else if ( c == "Sonic") {
        r = s + 40;
      }
    } else if (cond[0] == "SR" && cond[1] == "Sonic") {
      s = sampleSmallVar(min_r, max_r);
      a = sampleBigVar(min_a, max_a);
      if ( c == "Beat" ) {
        r = s + 40;
      } else if ( c == "Sonic") {
        r = s - 40;
      }
    } else if (cond[0] == "SA" && cond[1] == "Beat") {
      s = sampleSmallVar(min_a, max_a);
      r = sampleBigVar(min_r, max_r);
      if ( c == "Beat" ) {
        a = s - 40;
      } else if ( c == "Sonic") {
        a = s + 40;
      }
    } else if (cond[0] == "SA" && cond[1] == "Sonic") {
      s = sampleSmallVar(min_a, max_a);
      r = sampleBigVar(min_r, max_r);
      if ( c == "Beat" ) {
        a = s + 40;
      } else if ( c == "Sonic") {
        a = s - 40;
      }
    }
    in_array.truth.push(isRelevant(c));
    in_array.radius.push(r);
    in_array.angle.push(a);
  }
}

function randClass() {
  if (Math.random()>0.5){
    return "Beat"
  } else {
    return "Sonic"
  }
}

function isRelevant(c) {
  if (c==PREFERENCE) {
    return "Relevant";
  } else {
    return "Irrelevant";
  }
}

//####################
//    discrete random inputs
//####################
input_check = {radius: [], angle: [], truth: []};
add_check_contents(input_check, MAX_CHECK_TRIALS);

function add_check_contents(in_array, max_trials) {
  var n, n_split, n_sub, n_in_block;
  var r_arr, a_arr, sub_r_arr, sub_a_arr;
  var mix_arr, temp_arr;
  n = 16;
  n_split = 2;
  n_sub = n/n_split;
  n_in_block = max_trials/n_split/n_split;
  r_arr = discretize(STI_MARGIN, STI_AREA_W/2 - STI_MARGIN, n);
  a_arr = discretize(1, 180-1, n);
  temp_arr = [];
  for (r_split=0; r_split<n_split; r_split++) {
    for (a_split=0; a_split<n_split; a_split++) {
      sub_r_arr = subarray(r_arr, r_split*n_sub, (r_split+1)*n_sub-1);
      sub_a_arr = subarray(a_arr, a_split*n_sub, (a_split+1)*n_sub-1);
      mix_arr = broadcast(sub_r_arr, sub_a_arr);
      mix_arr = _.shuffle(mix_arr);
      for (i=0; i<n_in_block; i++) {
        temp_arr.push(mix_arr[i]);
      }
    }
  }
  temp_arr = _.shuffle(temp_arr);
  for (i=0; i<temp_arr.length; i++) {
    in_array.truth.push("N//A");
    in_array.radius.push(temp_arr[i][0]);
    in_array.angle.push(temp_arr[i][1]);
  }
}

// console.log(input_check)

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
slides.unshift({ name: "inter", constructor: inter_constructor});
for (i=0; i<MAX_INTER_TRIALS; i++){
  slides.unshift(
    {name: "inter_trial", constructor: inter_trials_constructor}
  )
}
slides.unshift({ name: "rating", constructor: rating_constructor});
slides.unshift({ name: "check", constructor: check_constructor});
for (i=0; i<MAX_CHECK_TRIALS; i++){
  slides.unshift(
    {name: "check_trial", constructor: check_trials_constructor}
  )
}
slides.unshift({ name: "survey", constructor: survey_constructor});

//####################
//    start domino!!
//####################
// console.log("Hello, World!") //debug tool!!
exp = {data: [], survey: [], time: [], config: []};
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
  text.append($("<p>").html("In this experiment, we are interested \
    in how people interact with recommender systems. \
    The experiemnt has four parts. \
    First, you will do a classification task to learn what kind of \
    &#34antennas&#34 receive from the relevant music station. \
    Second, you will interact with a recommender system. \
    Third, you will rate the recommender system. \
    Finally, we will check if you still remember how the antenna works. \
    The whole experiment will take roughly 5 minutes."))
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
    once you have read the instructions."))
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
  text.append($("<p>").html('Please read the following instructions \
    carefully.'))
  text.append($("<p>").html('In this first part, \
    you will see "loop antennas" that receive signals from one of two \
    music stations. \
    The station received depended in some way on the antenna&#39s \
    overall radius and the orientation of its inner diameter. \
    These antennas are noisy and can occasionally \
    receive from the wrong station.'))
  text.append($("<p>").html('One of these station is <b>relevant</b> \
    for training the recommender system later. \
    The goal here is to learn what kind of antennas most often \
    receive from the relevant station. \
    After an antenna is displayed, you can respond by clicking \
    on a button (Relevant/Irrelevant), or by using the keyboard \
    ("z" for Relevant / "m" for Irrelevant). \
    Upon responding, you will receive a feedback on correctness. \
    You will advance to the next part once you can distinguish the \
    antennas with 95% accuracy.'))
  text.append($("<p>").html("Please click Next after you have read \
    the instructions."))
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
      $("<button class='btn btn-default rel' value='Relevant'>")
        .text('Relevant (z)')
        .one("click", function() {training_feedback($(this))}),
      $("<button class='btn btn-default irrel' value='Irrelevant'>")
        .text('Irrelevant (m)')
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
    if (event.which == 122) {training_feedback($("button.rel"))}
    if (event.which == 109) {training_feedback($("button.irrel"))}
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
  slide.append($("<p>").html("Sorry, you have reached the limit \
    of training trials. Please return the HIT."))
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
}

function inter_constructor() {
// next button triggers inter_trials_constructor
  inter_start_time = new Date().getTime();
  slide = $("<div class='slide'>")
  text = $("<div class='block-text'>")
  text.append($("<p>").html('Well done!'));
  text.append($("<p>").html('Now, you are going to train the \
    recommender system by telling it if the \
    antenna it chose will receive from the relevant station. \
    You can respond as in the previous part. \
    While you are training the system, please also pay attention to \
    if it is improving. \
    You will be asked to rate the system later.'))
  text.append($("<p>").html("Please click Next after you have read \
    the instructions."))
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

function inter_trials_constructor() {
// buttons/key press trigger inter_feedback
  log_start_time = new Date().getTime() //bad form: storred in global var
  slide = $("<div class='slide' id='inter_slide' >")
  text = $("<div class='block-text' id='inter_text'>")
  table = $("<table align='center'>")
  row_stimulus_area = $("<tr align='center'>")
  row_buttons = $("<tr align='center'>")
  stimulus_area = $("<canvas id='stimulus' align='center'>")
  row_stimulus_area.append(stimulus_area)
  // response by button press
  row_buttons.append(
      $("<button class='btn btn-default rel' value='Relevant'>")
        .text('Relevant (z)')
        .one("click", function() {inter_feedback($(this))}),
      $("<button class='btn btn-default irrel' value='Irrelevant'>")
        .text('Irrelevant (m)')
        .one("click", function() {inter_feedback($(this))})
  )
  table.append(
      row_stimulus_area,
      row_buttons
  )
  text.append(
    $("<p>").html("Pleases pay attention to \
      if the recommender is improving. \
      The Next button will \
      appear once you finish all the trials. (Trials " + inter_trial
       + "/" + MAX_INTER_TRIALS + ")"),
    table
  )
  slide.append(text)
  $("body").append(slide)
  // response by key press
  $(window).on("keypress", function (event) {
    if (exp.training_complete) { return }
    if (event.which == 122) {inter_feedback($("button.rel"))}
    if (event.which == 109) {inter_feedback($("button.irrel"))}
  })
  r = input_inter.radius[inter_trial-1];
  a = input_inter.angle[inter_trial-1];
  $(document).ready(function(){draw_stimulus(r, a)})
  $(".slide").hide()
  slide.show()
}

function inter_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  log_end_time = new Date().getTime();
  choice = click_event.val();
  slide.append($("<p class='feedback-text'>").
    html(`Choice received`).css("color", "gray"))
  log_trial_data("inter", inter_trial,
    input_inter, choice, log_start_time, log_end_time);
  inter_trial += 1;
  inter_trials_end(inter_trial);
}

function inter_trials_end(x) {
// next slide goes back to inter_trials_constructor
  if (x <= MAX_INTER_TRIALS) {
    setTimeout(function() {show_next_slide(slides)},
      FEEDBACK_WAIT_TIME)
  }
  else {
    setTimeout(function() {inter_destructor()},
      FEEDBACK_WAIT_TIME)
  }
}

function inter_destructor() {
// next_button triggers show_next_slide
  inter_end_time = new Date().getTime()
  if (turk.previewMode == false) {
      $("#inter_slide").append($("<p>").append(next_button))
  }
}

function rating_constructor() {
//Rate button triggers show_next_slide
  rate_start_time = new Date().getTime();
  slide = $("<div class='slide' id='rating_slide' >")
  text = $("<div class='block-text' id='rating_text'>");
  text.append($("<p>").html('Please rate the recommender system \
    by adjusting the slide bar. \
    Click "Rate" to submit the rating and proeed to the \
    final part.'))
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

function check_constructor() {
// next button triggers check_trials_constructor
  check_start_time = new Date().getTime();
  slide = $("<div class='slide'>")
  text = $("<div class='block-text'>")
  text.append($("<p>").html("Finally, \
    we want to check if you still remember how the antenna works. \
    Unlike the first part, you will not receive feedback. \
    There will be a total of " + MAX_CHECK_TRIALS + " trials."))
  text.append($("<p>").html("Please click Next after you have read \
    the instructions."))
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
      $("<button class='btn btn-default rel' value='Relevant'>")
        .text('Relevant (z)')
        .one("click", function() {check_feedback($(this))}),
      $("<button class='btn btn-default irrel' value='Irrelevant'>")
        .text('Irrelevant (m)')
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
    if (event.which == 122) {check_feedback($("button.rel"))}
    if (event.which == 109) {check_feedback($("button.irrel"))}
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
  slide.append($("<p class='feedback-text'>").
    html(`Choice received`).css("color", "gray"))
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

function survey_constructor() {
// submit button triggers end_exp
  slide = $("<div class='slide' id='survey_slide' >")
  text = $("<div class='block-text' id='survey_text'>");
  text.append($("<p>").html("Thank you for taking our HIT. \
    Please answer the following questions."))
  text.append($("<p>").html('What was this experiment about? <br> \
    <input type="text" id="about" name="about" size="70">'))
  text.append($("<p>").html('What kind of antennas receive \
    from the relevant station? (eg. small radius, angle < 45 deg) <br> \
    <input type="text" id="strategy" name="strategy" size="70">'))
  text.append($("<p>").html('Did you use any external learning aids \
    (e.g. pencil and paper)? <br> \
    <input type="text" id="external_aid" name="external_aid" size="70">'))
  text.append($("<p>").html('How can we make this experiment better? \
    <br> <input type="text" id="better" name="better" size="70">'))
  text.append($("<p>").html('Was anything unclear? <br> \
    <input type="text" id="unclear" name="unclear" size="70">'))
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
  if ($('#about').val().length != 0 || $('#strategy').val().length != 0) {
    slide = $("<div class='slide' id='submit' >")
    text = $("<div class='block-text' id='submit_text'>")
    text.append($("<p>").html("You're submit - thanks for " +
      "participating! Submitting to Mechanical Turk..."))
    slide.append(text)
    $("body").append(slide)
    $(".slide").hide()
    slide.show()
    // store survey data
    survey_data = {
      about: $('#about').val(),
      strategy: $('#strategy').val(),
      external_aid: $('#external_aid').val(),
      better: $('#better').val(),
      unclear: $('#unclear').val(),
      comment: $('#comments').val(),
      age: $('#age').val(),
      gender: $('#gender').val(),
      turkSubmitTo: turk.turkSubmitTo
    }
    exp.survey.push(survey_data);
    // store timing data
    time_data = {
      user_rating: user_rating,
      exp_start_time: exp_start_time,
      training_start_time: training_start_time,
      training_end_time: training_end_time,
      inter_start_time: inter_start_time,
      inter_end_time: inter_end_time,
      check_start_time: check_start_time,
      check_end_time: check_end_time,
      rate_start_time: rate_start_time,
      rate_end_time: rate_end_time,
      exp_end_time: exp_end_time
    }
    exp.time.push(time_data);
    // store configs
    config_data = {
      STI_AREA_W: STI_AREA_W,
      STI_AREA_H: STI_AREA_H,
      STI_MARGIN: STI_MARGIN,
      STI_RADIUS_MIN: STI_RADIUS_MIN,
      STI_RADIUS_MAX: STI_RADIUS_MAX,
      STI_ANGLE_MIN: STI_ANGLE_MIN,
      STI_ANGLE_MAX: STI_ANGLE_MAX,
      SCORE_BAR_W: SCORE_BAR_W,
      SCORE_BAR_H: SCORE_BAR_H,
      SCORE_THRESH: SCORE_THRESH,
      SCORE_MEMORY_MAX: SCORE_MEMORY_MAX,
      MAX_TRAIN_TRIALS: MAX_TRAIN_TRIALS,
      MAX_INTER_TRIALS: MAX_INTER_TRIALS,
      MAX_CHECK_TRIALS: MAX_CHECK_TRIALS,
      INSTRUCTION_WAIT_TIME: INSTRUCTION_WAIT_TIME,
      FEEDBACK_WAIT_TIME: FEEDBACK_WAIT_TIME,
      SAMP_CAT_COND: SAMP_CAT_COND,
      PREFERENCE: PREFERENCE
    }
    exp.config.push(config_data);
    setTimeout(function() {turk.submit(exp)}, 500)
  }
  else {
    text.append($("<p style='color:red'>").html('Please answer the \
      first two questions before submtting.'))
  }
}

//####################
//    math utils
//####################

function sampleSmallVar(min, max) {
  var mid, std;
  mid = (min + max)/2;
  std = Math.sqrt(75);
  return normalRandomInRange(mid, std, min, max);
}

function sampleBigVar(min, max) {
  var mid, std;
  mid = (min + max)/2;
  std = 30;
  return normalRandomInRange(mid, std, min, max);
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

function discretize(min, max, n) {
  var arr, dx;
  arr = [];
  dx = (max-min)/(n-1);
  for (i=0; i<n; i++) {
    arr.push(min + i*dx);
  }
  return arr;
}

function broadcast(arr1, arr2) {
  var arr = [];
  for (i=0; i<arr1.length; i++) {
    for (j=0; j<arr2.length; j++) {
      arr.push([arr1[i], arr2[j]]);
    }
  }
  return arr;
}

function subarray(arr, indi, indf) {
  var subarr = [];
  for (i=indi; i<=indf; i++) {
    subarr.push(arr[i]);
  }
  return subarr;
}

//####################
//    tests
//####################

function inter_input_stat() {
  var n = 10000;
  small_var_array = [];
  big_var_array = [];
  for (i=0; i<n; i++) {
    small_var_array.push(sampleSmallVar(STI_RADIUS_MIN, STI_RADIUS_MAX));
    big_var_array.push(sampleBigVar(STI_ANGLE_MIN, STI_ANGLE_MAX));
  }
  console.log("Length array = %s", small_var_array.length)
  console.log("Mean radisu = %s|%s",
    mean(small_var_array),
    (STI_RADIUS_MIN + STI_RADIUS_MAX)/2);
  console.log("Mean angle = %s|%s",
    mean(big_var_array),
    (STI_ANGLE_MIN + STI_ANGLE_MAX)/2);
  console.log("Std small var = %s|%s",
    std(small_var_array), Math.sqrt(75));
  console.log("Std big var = %s|%s",
    std(big_var_array), 30);
}

// inter_input_stat()
