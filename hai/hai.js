// This code uses a domino construction:
// 2016-03-21: canvas is supported in most browsers; should comment out all console.log()
// 2016-03-29: name inconsistncy - training & train

// Differences between us and Markant & Gureckis:
//
// Their non-active training is just watching the stimuli with the label.
// We cannot do this because we have to measure the participants'
// performance in the training phase.
//
// They use 600 discrete steps for training, we use continuous values.
//
// I think all their random samples used the true generatative label,
// while their non-random samples used the optimal-decision-rule label.
// So, I am using the true label.
//
// In their table 1, the smaller variance is 2000, which means achieving
// score_thresh = 0.95 is impossible.
// For this reason, we use 75 following Ashby 2002.
//
// In their setup, stimuli are shown for only 250ms. In ours, unlimited.

//####################
// experimental data
//####################
var EXP_TYPE = $('body').attr('id');
var EXP = {data: [], modelParams: [], startTimes: {}, endTimes: {},
           survey: [], config: [], instruction: []};

//####################
// configuration var
//####################
var STI_AREA_W = 300; //PX
var STI_AREA_H = 300; //px
var STI_RADIUS_BASE = Math.random()*10; //px
var STI_ANGLE_BASE = Math.random()*30; //deg

var SCORE_THRESH = 0.95; //0.95;
var SCORE_MEMORY_MAX = 20;

var INSTRUCTION_WAIT_TIME = 3000; //3000 ms
var FEEDBACK_WAIT_TIME = 1000; //ms

var sampSti = new SampleStimulus();
var setSti = new SetStimulus(STI_AREA_W, STI_RADIUS_BASE, STI_ANGLE_BASE);
var myLogit = new MyLogit();
var myMath = new MyMath();

var SAMP_CAT_COND = setSti.randCond();
var PREFERENCE = setSti.randClass();
// console.log(SAMP_CAT_COND);
// console.log(PREFERENCE);



//####################
// dynamic global variables initialization
//####################
var SLIDE_TYPE = "";
var SLIDE_NAME = "";

var TRAIN_TRIAL = 1;
var INTER_TRIAL = 1;
var CHECK_TRIAL = 1;

var LOG_START_TIME = new Date().getTime();
var LOG_END_TIME = new Date().getTime();

var SCORE_MEMORY = [];
for (i=0; i<SCORE_MEMORY_MAX; i++) {
  SCORE_MEMORY.push(0);
}

//####################
// random inputs
//####################
var MAX_TRAIN_TRIALS = 500; //500;
var MAX_INTER_TRIALS = 20; //20;
var MAX_CHECK_TRIALS = 5*4; //5*4; //should be multiples of 4;
var INIT_COEFS = [0, 0, 0];
var N_INIT_SAMP = 2;

var INPUT_TRAIN = setSti.setTrials(MAX_TRAIN_TRIALS, SAMP_CAT_COND);
var INPUT_INTER = {radius: [], angle: [], truth: []};
var INPUT_CHECK = setSti.setCheckTrials(MAX_CHECK_TRIALS, SAMP_CAT_COND);

var N_CANDIDATES = 400;
var CANDIDATES = setSti.setTrials(N_CANDIDATES, SAMP_CAT_COND);
// console.log(INPUT_INTER);


//####################
// instruction functions
//####################
function instruction_constructor(in_text) {
  var slide, text, next_button;
  slide = $("<div class='slide' id='instruction_slide'>");
  text = $("<div class='block-text' id='instruction_text'>");
  text.append(in_text);
  slide.append(text);
  $("body").append(slide);
  $(".slide").hide();
  slide.show();
  var timeStr = SLIDE_NAME+" start time";
  EXP.startTimes[SLIDE_NAME] = new Date().getTime();
  if (turk.previewMode == false) {
    next_button = $("<button>").text("Next").one("click", function() {
      EXP.endTimes[SLIDE_NAME] = new Date().getTime();
      show_next_slide(SLIDES);
    });
    setTimeout(function() {
      $("#instruction_text").append($("<p>").append(next_button))},
      INSTRUCTION_WAIT_TIME
    );
  };
};

function rating_constructor(in_text) {
  var slide, text, slider;
  EXP.startTimes[SLIDE_NAME] = new Date().getTime();
  slide = $("<div class='slide' id='rating_slide' >");
  text = $("<div class='block-text' id='rating_text'>");
  slider = $("<input id='rating_slider' type='range' min='0' max='100' value='50'>")
    .click( function() {$("#rating_slide").append(RATE_BUTTON)} );
  text.append(in_text);
  text.append(slider);
  text.append($("<p>").html('<span style="float:left">Very poor</span>\
    <span style="float:right">Excellent</span>'));
  text.append($("<p>").html("<br>"));
  slide.append(text);
  $("body").append(slide);
  $(".slide").hide();
  slide.show();
  //console.log("rating value = %s", $("#rating_slider").val())
};

var RATE_BUTTON = $("<button>").text("Rate").
  click(function() {
    EXP.endTimes[SLIDE_NAME] = new Date().getTime();
    user_rating = $("#rating_slider").val();
    show_next_slide(SLIDES)
});

function survey_constructor(in_text) {
  var slide, text, submit_button;
  EXP.startTimes[SLIDE_NAME] = new Date().getTime();
  slide = $("<div class='slide' id='survey_slide' >");
  text = $("<div class='block-text' id='survey_text'>");
  submit_button = $("<button>").text("Submit to Turk").click(function() {
      EXP.endTimes[SLIDE_NAME] = new Date().getTime();
      exp_end();
    });
  text.append(in_text, submit_button);
  slide.append(text);
  $("body").append(slide);
  $(".slide").hide();
  slide.show();
};

function exp_end() {
  var slide, text;
  var survey_data, time_data, config_data;
  slide = $("#survey_slide");
  text = $("#survey_text");
  // check survey data,then submit exp to turk
  if ($('#about').val().length != 0) {
    text.append($("<p>").html("You're submit - thanks for \
      participating! Submitting to Mechanical Turk..."));
    slide.append(text);
    $("body").append(slide);
    $(".slide").hide();
    slide.show();
    // data, startTimes, and endTimes alrady logged during experiemnt
    logConfigData();
    logSurveyData();
    // EXP.instruction.push(TEXT);
    // console.log(EXP);
    setTimeout(function() {turk.submit(EXP)}, 500);
  } else {
    text.append($("<p style='color:red'>").html('Please answer the \
      first question before submtting.'));
  };
};


//####################
// log functions
//####################
function logTrialData(name, ind, inArr, choice, ti, tf) {
  var trial_data = {trial_type: name,
    trial_number: ind,
    response: choice,
    answer: inArr.truth[ind-1],
    stimulus_radius: inArr.radius[ind-1],
    stimulus_angle: inArr.angle[ind-1],
    trial_start_time: ti,
    trial_end_time: tf,
    trail_time: tf - ti
  };
  EXP.data.push(trial_data);
};

function logModelParameters(name, ind, coefs) {
  var paramData = {trial_type: name,
    trial_number: ind,
    coeficients: coefs //const, radius factor, angle factor
  };
  EXP.modelParams.push(paramData);
};

function logSurveyData() {
  var survey_data = {about: $('#about').val(),
    strategy: $('#strategy').val(),
    external_aid: $('#external_aid').val(),
    better: $('#better').val(),
    unclear: $('#unclear').val(),
    comment: $('#comments').val(),
    age: $('#age').val(),
    gender: $('#gender').val(),
    turkSubmitTo: turk.turkSubmitTo
  };
  EXP.survey.push(survey_data);
};

function logConfigData() {
  var configData = {STI_AREA_W: STI_AREA_W,
    STI_AREA_H: STI_AREA_H,
    STI_RADIUS_BASE: STI_RADIUS_BASE,
    STI_ANGLE_BASE: STI_ANGLE_BASE,
    STI_MARGIN: setSti.STI_MARGIN,
    STI_SHIFT: setSti.STI_SHIFT,
    STI_RADIUS_MIN: setSti.STI_RADIUS_MIN,
    STI_RADIUS_MAX: setSti.STI_RADIUS_MAX,
    STI_ANGLE_MIN: setSti.STI_ANGLE_MIN,
    STI_ANGLE_MAX: setSti.STI_ANGLE_MAX,
    SCORE_THRESH: SCORE_THRESH,
    SCORE_MEMORY_MAX: SCORE_MEMORY_MAX,
    MAX_TRAIN_TRIALS: MAX_TRAIN_TRIALS,
    MAX_INTER_TRIALS: MAX_INTER_TRIALS,
    MAX_CHECK_TRIALS: MAX_CHECK_TRIALS,
    // N_CANDIDATES: N_CANDIDATES,
    // CANDIDATES: CANDIDATES,
    INSTRUCTION_WAIT_TIME: INSTRUCTION_WAIT_TIME,
    FEEDBACK_WAIT_TIME: FEEDBACK_WAIT_TIME,
    SAMP_CAT_COND: SAMP_CAT_COND,
    PREFERENCE: PREFERENCE,
    EXP_TYPE: EXP_TYPE
  };
  EXP.config.push(configData);
};


//####################
// utility functions
//####################
function formatCANDIDATES() {
  var candidates = [];
  var n = CANDIDATES.radius.length;
  for(var i=0; i<n; i++) {
    candidates.push([CANDIDATES.radius[i], CANDIDATES.angle[i]]);
  };
  return candidates;
};


//####################
// trial functions
//####################

function training_trials_constructor() {
// buttons/key press trigger training_feedback
  LOG_START_TIME = new Date().getTime() //bad form: storred in global var
  var slide = $("<div class='slide' id='training_slide' >")
  var text = $("<div class='block-text' id='training_text'>")
  var table = $("<table align='center'>")
  var row_score_bar = $("<tr align='center'>")
  var row_stimulus_area = $("<tr align='center'>")
  var row_buttons = $("<tr align='center'>")
  var score_bar = $("<canvas id='score' align='center'>")
  var stimulus_area = $("<canvas id='stimulus' align='center'>")
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
  );
  table.append(row_score_bar, row_stimulus_area, row_buttons);
  text.append($("<p align='center'>").html("The Next button will appear \
    once you reach " + 100*SCORE_THRESH + "% in score. You will have a \
    maximimum of " + MAX_TRAIN_TRIALS + " trials to accomplish this. (Trial "
    + TRAIN_TRIAL + ")")
  );
  text.append(table);
  slide.append(text);
  $("body").append(slide);
  // response by key press
  $(window).on("keypress", function (event) {
    if (event.which == 122) {training_feedback($("button.beat"))}
    if (event.which == 109) {training_feedback($("button.sonic"))}
  })
  var r = INPUT_TRAIN.radius[TRAIN_TRIAL-1];
  var a = INPUT_TRAIN.angle[TRAIN_TRIAL-1];
  $(document).ready(function(){draw_score_bar()})
  $(document).ready(function(){draw_stimulus(r, a)})
  $(".slide").hide()
  slide.show()
};


function training_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  LOG_END_TIME = new Date().getTime();
  var choice = click_event.val();
  var truth = INPUT_TRAIN.truth[TRAIN_TRIAL-1];
  SCORE_MEMORY.shift();
  if (choice == truth) {
    SCORE_MEMORY.push(1)
    $("#training_slide").append($("<p class='feedback-text'>").
      html('Correct').css("color", "green"))
  } else {
    SCORE_MEMORY.push(0)
    $("#training_slide").append($("<p class='feedback-text'>").
      html('Incorrect').css("color", "red"))
  };
  logTrialData(SLIDE_NAME, TRAIN_TRIAL, INPUT_TRAIN,
               choice, LOG_START_TIME, LOG_END_TIME);
  TRAIN_TRIAL += 1;
  var frac = fraction_score(SCORE_MEMORY);
  training_trials_end(frac, TRAIN_TRIAL);
};


function training_trials_end(score, ind) {
  if (score >= SCORE_THRESH) {
    setTimeout(function() {trial_destructor("#training_slide")},
               FEEDBACK_WAIT_TIME );
  } else if (ind < MAX_TRAIN_TRIALS) {
    // console.log("slides length = %s", slides.length)
    SLIDES.push({ name: "training_trial", type: "trial",
                constructor: training_trials_constructor});
    // console.log("slides length = %s", slides.length)
    setTimeout(function() {show_next_slide(SLIDES)}, FEEDBACK_WAIT_TIME);
  } else if (ind == MAX_TRAIN_TRIALS) {
    setTimeout(function() {warning_constructor()}, FEEDBACK_WAIT_TIME);
  };
};


function trial_destructor(attachId) {
  if (turk.previewMode == false) {
    var next_button = $("<button>").text("Next")
                      .one("click", function() {show_next_slide(SLIDES)} );
    $(attachId).append($("<p>").append(next_button));
  };
};

function warning_constructor() {
  var slide = $("<div class='slide'>")
  slide.append($("<p>").html("Sorry, you have reached the limit \
    of training trials. Please return the HIT."))
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
};


function inter_trials_constructor() {
// buttons/key press trigger inter_feedback
  LOG_START_TIME = new Date().getTime() //bad form: storred in global var
  var slide = $("<div class='slide' id='inter_slide' >")
  var text = $("<div class='block-text' id='inter_text'>")
  var table = $("<table align='center'>")
  var row_stimulus_area = $("<tr align='center'>")
  var row_buttons = $("<tr align='center'>")
  var stimulus_area = $("<canvas id='stimulus' align='center'>")
  row_stimulus_area.append(stimulus_area)
  // response by button press
  row_buttons.append(
      $("<button class='btn btn-default like' value='Like'>")
        .text('Like')
        .one("click", function() {inter_feedback($(this))}),
      $("<button class='btn btn-default dislike' value='Dislike'>")
        .text('Dislike')
        .one("click", function() {inter_feedback($(this))})
  );
  table.append(row_stimulus_area, row_buttons);
  text.append($("<p align='center'>").html("Remember that you \
    like <b>"+ PREFERENCE + "</b>. \
    The Next button will appear once you finish all the trials. \
    (Trials " + INTER_TRIAL + "/" + MAX_INTER_TRIALS + ")")
  );
  text.append(table);
  slide.append(text);
  $("body").append(slide);
  // response by key press
  // $(window).on("keypress", function (event) {
  //   if (event.which == 122) {inter_feedback($("button.like"))}
  //   if (event.which == 109) {inter_feedback($("button.dislike"))}
  // })
  if (INTER_TRIAL > N_INIT_SAMP) {
    // console.log(EXP_TYPE);
    var radiusAngle = theAlgorithm();
    var r = radiusAngle[0];
    var a = radiusAngle[1];
    // console.log("Algorithm done computing.");
    // console.log(r);
    // console.log(a);
  } else {
    INPUT_INTER.radius.push(CANDIDATES.radius[INTER_TRIAL-1]);
    INPUT_INTER.angle.push(CANDIDATES.angle[INTER_TRIAL-1]);
    INPUT_INTER.truth.push(CANDIDATES.truth[INTER_TRIAL-1]);
    CANDIDATES.radius.splice(INTER_TRIAL-1, 1)
    CANDIDATES.angle.splice(INTER_TRIAL-1, 1)
    CANDIDATES.truth.splice(INTER_TRIAL-1, 1)
    EXP.modelParams.push(INIT_COEFS);
    var r = INPUT_INTER.radius[INTER_TRIAL-1];
    var a = INPUT_INTER.angle[INTER_TRIAL-1];
  };
  // console.log("INPUT_INTER legnth: ", INPUT_INTER.length);
  // console.log("CANDIDATES length: ", CANDIDATES.length);
  $(document).ready(function(){
    draw_stimulus(r, a);
    // console.log("Stimulus drawn.")
  });
  $(".slide").hide();
  slide.show();
};


function theAlgorithm() {
  var r, a, data, xTrain, yTrain, meanVec, stdVec, standardX,
      finalCoefs, candidates, xChosen_indVal, optLabel, indChosen;
  data = setSti.reformatForMyLogit(INPUT_INTER, PREFERENCE);
  xTrain = data[0];
  yTrain = data[1];
  meanVec = myMath.meanMatCol(xTrain);
  stdVec = myMath.stdMatCol(xTrain);
  standardX = myMath.standardizeMatCol(xTrain);
  finalCoefs = myLogit.train(INIT_COEFS, standardX, yTrain, 1, 100);
  finalCoefs = myLogit.unstandardizeCoefs(finalCoefs, meanVec, stdVec);
  candidates = formatCANDIDATES();
  EXP.modelParams.push(finalCoefs);
  if (EXP_TYPE == "hai-random") {
    xChosen_indVal = [[CANDIDATES.radius[INTER_TRIAL-1],
                       CANDIDATES.angle[INTER_TRIAL-1]], [INTER_TRIAL-1, NaN]];
  } else if (EXP_TYPE == "hai-active") {
    xChosen_indVal = myLogit.mostUncertain(finalCoefs, candidates);
  } else if (EXP_TYPE == "hai-filter") {
    xChosen_indVal = myLogit.highestProb(finalCoefs, candidates);
  };
  r = xChosen_indVal[0][0];
  a = xChosen_indVal[0][1];
  indChosen = xChosen_indVal[1][0];
  // Use if candiates are generated using setSti.setGridCandidates()
  // optLabel = setSti.decisionRule(r, a, SAMP_CAT_COND);
  // console.log("r:", r, "r candidate:", CANDIDATES.radius[indChosen]); //check
  // console.log("a:", a, "a candidate:", CANDIDATES.angle[indChosen]);
  INPUT_INTER.radius.push(CANDIDATES.radius[indChosen]);
  INPUT_INTER.angle.push(CANDIDATES.angle[indChosen]);
  INPUT_INTER.truth.push(CANDIDATES.truth[indChosen]);
  CANDIDATES.radius.splice(indChosen, 1);
  CANDIDATES.angle.splice(indChosen, 1);
  CANDIDATES.truth.splice(indChosen, 1);
  return [r, a];
};


function inter_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  LOG_END_TIME = new Date().getTime();
  var choice = click_event.val();
  $("#inter_slide").append($("<p class='feedback-text'>").
    html('Choice received').css("color", "gray"))
  logTrialData(SLIDE_NAME, INTER_TRIAL, INPUT_INTER,
               choice, LOG_START_TIME, LOG_END_TIME);
  INTER_TRIAL += 1;
  inter_trials_end(INTER_TRIAL);
};


function inter_trials_end(x) {
  if (x <= MAX_INTER_TRIALS) {
    SLIDES.push({name: "interaction_trial", type: "trial",
                constructor: inter_trials_constructor});
    setTimeout(function() {show_next_slide(SLIDES)}, FEEDBACK_WAIT_TIME);
  } else {
    setTimeout(function() {trial_destructor("#inter_slide")}, FEEDBACK_WAIT_TIME);
  };
};


function check_trials_constructor() {
// buttons/key press trigger check_feedback
  LOG_START_TIME = new Date().getTime() //bad form: storred in global var
  var slide = $("<div class='slide' id='check_slide' >")
  var text = $("<div class='block-text' id='check_text'>")
  var table = $("<table align='center'>")
  var row_stimulus_area = $("<tr align='center'>")
  var row_buttons = $("<tr align='center'>")
  var stimulus_area = $("<canvas id='stimulus' align='center'>")
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
  table.append(row_stimulus_area, row_buttons);
  text.append($("<p align='center'>").html("The Next button will \
    appear once you finish all the trials. (Trials " + CHECK_TRIAL
     + "/" + MAX_CHECK_TRIALS + ")")
  );
  text.append(table);
  slide.append(text);
  $("body").append(slide);
  // response by key press
  $(window).on("keypress", function (event) {
    if (event.which == 122) {check_feedback($("button.beat"))}
    if (event.which == 109) {check_feedback($("button.sonic"))}
  })
  var r = INPUT_CHECK.radius[CHECK_TRIAL-1];
  var a = INPUT_CHECK.angle[CHECK_TRIAL-1];
  $(document).ready(function(){draw_stimulus(r, a)});
  $(".slide").hide();
  slide.show();
};


function check_feedback(click_event) {
  // disable event handlers -> user can only respond once per trial
  $(':button').off("click");
  $(window).off("keypress");
  LOG_END_TIME = new Date().getTime();
  var choice = click_event.val();
  $("#check_slide").append($("<p class='feedback-text'>").
    html('Choice received').css("color", "gray"))
  logTrialData(SLIDE_NAME, CHECK_TRIAL, INPUT_CHECK,
               choice, LOG_START_TIME, LOG_END_TIME);
  CHECK_TRIAL += 1;
  check_trials_end(CHECK_TRIAL);
};


function check_trials_end(x) {
// next slide goes back to check_trials_constructor
  if (x <= MAX_CHECK_TRIALS) {
    SLIDES.push({name: "check_trial", type: "trial",
                constructor: check_trials_constructor});
    setTimeout(function() {show_next_slide(SLIDES)}, FEEDBACK_WAIT_TIME);
  } else {
    setTimeout(function() {trial_destructor("#check_slide")}, FEEDBACK_WAIT_TIME);
  };
};


//####################
// drawing functions
//####################
var SCORE_BAR_W = 100; //px
var SCORE_BAR_H = 20; //px

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
  var frac = fraction_score(SCORE_MEMORY);
  ctx.beginPath();
  ctx.rect(0, 0, frac*SCORE_BAR_W, SCORE_BAR_H);
  ctx.fillStyle = 'green';
  ctx.fill();
  //show score as text
  ctx.fillStyle = 'white';
  ctx.font = 0.8*SCORE_BAR_H + "px Arial";
  ctx.fillText(Math.floor(frac*100) + "%",
    SCORE_BAR_W/2, SCORE_BAR_H - 0.1*SCORE_BAR_H);
};

function fraction_score(score_memory) {
  var frac = 0;
  for (var i=0; i<score_memory.length; i++){
    frac += score_memory[i]; // SCORE_MEMORY is global
  };
  frac = frac/SCORE_MEMORY_MAX;
  return frac
};

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
  var a = angle/180*Math.PI; //deg to rad
  var dx = radius*Math.cos(a);
  var dy = -radius*Math.sin(a);
  var xi = STI_AREA_W/2 + dx;
  var yi = STI_AREA_H/2 + dy;
  var xf = STI_AREA_W/2 - dx;
  var yf = STI_AREA_H/2 - dy;
  ctx.beginPath();
  ctx.moveTo(xi,yi);
  ctx.lineTo(xf,yf);
  ctx.stroke()
};

//####################
// text
//####################
var TEXT = {};

TEXT["welcome"] = ["In this experiment, we are interested \
  in how people interact with computer algorithms. \
  The experiment has four parts. \
  First, you will play a classification game to learn what kind \
  of &#34antennas&#34 receive from which &#34music station.&#34 \
  Second, you will interact with an algorithm and teach it \
  to recommed a particular station. \
  Third, you will rate the recommender algorithm. \
  Finally, we will check if you still remember how the antennas work. \
  The whole experiment will take roughly 5 minutes.</p>"
];


TEXT["formal"] = ["<p>(Note: you won't be able to preview this HIT before \
  accepting it.)</p>",

  "<p>By answering the following questions, you \
  are participating in a study being performed by researchers \
  in the Department of Mathmematics & Computer Science at Rutgers \
  University. If you have questions about this research, \
  please contact us at cocoscishafto@gmail.com. \
  You must be at least 18 years old to participate. \
  Your participation in this research is voluntary. You may decline to \
  answer any or all of the following questions. You may decline further \
  participation, at any time, without adverse consequences. Your \
  anonymity is assured; the researchers who have requested your \
  participation will not receive any personal information about you.</p>",

  "<p>We have recently been made aware that your \
  public Amazon.com profile can be accessed via your worker ID if you \
  do not choose to opt out. If you would like to opt out of this \
  feature, you may follow instructions available <a href =\
  'http://www.amazon.com/gp/help/customer/display.html?nodeId=16465241'\
  > here.</a></p>",

  "<p>Please click Next after you have read the instructions.</p>"
];


TEXT["training_instruction"] = ["<p>Please read the following instructions \
  carefully.</p>",

  "<p>In this first part, \
  you will see &#34loop antennas&#34 that receive signals from \
  one of two music stations (Beat or Sonic). \
  The station received depended in some way on the antenna&#39s \
  overall <b>radius</b> and the <b>orientation</b> of its \
  inner diameter. These antennas are noisy and can occasionally \
  receive from the wrong station.</p>",

  "<p>The goal here is to learn what kind \
  of antennas most often receive from which station. \
  After an antenna is displayed, you can respond by clicking \
  on a button (Beat / Sonic), or by using the keyboard \
  (&#34z&#34 for Beat / &#34m&#34 for Sonic). \
  Upon responding, you will receive a feedback on correctnesampSti. \
  You will advance to the next part once you can distinguish the \
  antennas with 95% accuracy.</p>",

  "<p>Please click Next after you have read the instructions.</p>"
];


TEXT["interaction_instruction"] = ["<p>Well done!</p>",

  "<p>Now, pretend that you like <b>" + PREFERENCE + "</b>.</p>",

  "<p>You are going to teach an algorithm to recommend the station that you like. \
  You will do so by telling the algorithm whether the antenna \
  it chose will receive from your preferred station. \
  In this part, you can only respond by cliking a button (like/dislike). \
  This is to encourage you to pay attention to whether the \
  algorithm is improving, that is, whether it increasingly \
  chooses antennas that recieve from the station that you like. \
  You will be asked to rate the algorithm later.</p>",

  "<p>Please click Next after you have read the instructions.</p>"
];


TEXT["rating"] = ["<p>Did the algorithm eventually learn to \
  recommend your preferred station? \
  Please rate how well it did by adjusting the slide bar. \
  Click &#34Rate&#34 to submit the rating and proeed to the \
  final part.</p>"
];


TEXT["check_instruction"] = ["<p>Finally, \
  we want to check if you still remember how the antennas work. \
  Unlike the first part, you will not receive corrective feedback. \
  There will be a total of " + MAX_CHECK_TRIALS + " trials.</p>",

"<p>Please click Next after you have read the instructions.</p>"
];


TEXT["survey"] = ["<p>Thank you for taking our HIT. \
    Please answer the following questions.</p>",

  "<p>What was this experiment about? <br> \
    <input type='text' id='about' name='about' size='70'></p>",

  "<p>What kind of antennas receive from the " + PREFERENCE + "? \
    (eg. small radius, orientation clockwise from vertical) <br> \
    <input type='text' id='strategy' name='strategy' size='70'></p>",

  "<p>Did you use any external learning aids (e.g. pencil and paper)? <br> \
    <input type='text' id='external_aid' name='external_aid' size='70'></p>",

  "<p>How can we make this experiment better? \
    <br> <input type='text' id='better' name='better' size='70'></p>",

  "<p>Was anything unclear? <br> \
    <input type='text' id='unclear' name='unclear' size='70'></p>",

  "<p>Any other comments for us? <br> \
    <input type='text' id='comments' name='comments' size='70'></p>",

  "<p>What is your age? <br> \
    <input type='text' id='age' name='age' size='20'></p>",

  "<p>What is your gender? (m = male, f = female, o = other) <br> \
    <input type='text' id='gender' name='gender' size='20'></p>"
];


//####################
// slides
//####################
var SLIDES = [];

SLIDES.unshift({name: "welcome", type: "instruction",
  text: TEXT["welcome"].concat(TEXT["formal"]),
  constructor: instruction_constructor});
SLIDES.unshift({name: "training_instruction", type: "instruction",
  text: TEXT["training_instruction"],
  constructor: instruction_constructor});
SLIDES.unshift({name: "training_trial", type: "trial",
  constructor: training_trials_constructor});
SLIDES.unshift({name: "interaction_instruction", type: "instruction",
  text: TEXT["interaction_instruction"],
  constructor: instruction_constructor});
SLIDES.unshift({name: "interaction_trial", type: "trial",
  constructor: inter_trials_constructor});
SLIDES.unshift({ name: "rating", type: "instruction",
  text: TEXT["rating"],
  constructor: rating_constructor});
SLIDES.unshift({name: "check_instruction", type: "instruction",
  text: TEXT["check_instruction"],
  constructor: instruction_constructor});
SLIDES.unshift({name: "check_trial", type: "trial",
  constructor: check_trials_constructor});
SLIDES.unshift({name: "survey", type: "instruction",
  text: TEXT["survey"],
  constructor: survey_constructor});


function show_next_slide() {
  var next_slide;
  $(".slide").remove();
  next_slide = SLIDES.pop();
  SLIDE_TYPE = next_slide.type;
  SLIDE_NAME = next_slide.name;
  if (next_slide.type == "instruction") {
    next_slide.constructor(next_slide.text);
  } else {
    next_slide.constructor();
  };
};

//####################
// start domino!!
//####################
show_next_slide(SLIDES);
