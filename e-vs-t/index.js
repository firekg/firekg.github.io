//####################
// configuration var
//####################
var INSTRUCTION_WAIT_TIME = 3; //ms
var FEEDBACK_WAIT_TIME = 750; //ms
var BOARD_SIZE = 4;
var CELL_SIZE = 70; //px
var HYPO_NAME = ['H1', 'H2', 'H3', 'H4'];
var SCORE_MEMORY = [];

//####################
// global varibales (should be avoided...)
//####################
var TRIAL_COUNT = 0;
var CLICK_COUNT = 0;
var CLICKED_TIMES = [];
var SLIDE_TYPE = "";
var CLICKED_LIN_IND = [];
var LOG_START_TIME = new Date().getTime();
var LOG_END_TIME = new Date().getTime();

//####################
// functions
//####################
function instruction_constructor(in_text) {
  var slide, text, next_button;
  slide = $("<div class='slide' id='instruction_slide' >");
  text = $("<div class='block-text' id='instruction_text'>");
  text.append(in_text);
  slide.append(text)
  $("body").append(slide)
  $(".slide").hide()
  slide.show()
  if (turk.previewMode == false) {
    TRIAL_COUNT = 0;
    next_button = $("<button>").text("Next").
      one("click", function() {show_next_slide(SLIDES)});
    setTimeout(function() {
      $("#instruction_text").append($("<p>").append(next_button))},
      INSTRUCTION_WAIT_TIME)
  };
};

function trial_constructor(in_text, pattern) {
  var slide, text, table;
  var row_score_bar, row_board, row_buttons;
  var board, gBoard;
  // re-initlaize global tracking variables
  LOG_START_TIME = new Date().getTime();
  CLICK_COUNT = 0;
  CLICKED_LIN_IND = [];
  CLICKED_TIMES = [];
  if (TRIAL_COUNT == 0) {
    reset_score(TRIAL_CONFIG[SLIDE_TYPE]["memory_limit"]);
  };
  // set up slide elements
  slide = $("<div class='slide' id='trial_slide' >");
  text = $("<div class='block-text' id='trial_text'>");
  table = $("<table id='trial_table' align='center'>");
  board = $("<table id='gBoard'>");
  row_score_bar = $("<tr align='center'>").append(SCORE_BAR);
  row_board = $("<tr align='center'>").append(board);
  row_buttons = $("<tr id='row_buttons' align='center'>");
  table.append(row_score_bar, row_board, row_buttons);
  text.append(in_text);
  text.append($("<p align='center'>").html("Trial "+ (TRIAL_COUNT+1) + "/"
    + TRIAL_CONFIG[SLIDE_TYPE]["max_trials"]));
  text.append(table);
  slide.append(text);
  $("body").append(slide);
  $(".slide").hide();
  // draw gBoard and call gBoard function
  gBoard = jsboard.board({ attach: 'gBoard',
    size: BOARD_SIZE + "x" + BOARD_SIZE});
  $(document).ready(function() {board_configure(gBoard)});
  trial_type_specific_show(gBoard, pattern);
  // show slide
  slide.show();
};

function trial_type_specific_show(gBoard, pattern) {
  console.log(SLIDE_TYPE)
  if (SLIDE_TYPE == "learn") {
    $(document).ready(function() {
      draw_score_bar();
      board_show(gBoard, pattern)
    });
  } else if (SLIDE_TYPE == "explo") {
    $(document).ready(function() {
      board_explore(gBoard, pattern)
    });
  } else if (SLIDE_TYPE == "guide") {
    $(document).ready(function() {
      draw_score_blank();
      board_key_configure(gBoard);
      board_guide(gBoard, pattern)
    });
  };
};

function hypo_feedback(click_event) {
  var choice, truth, frac;
  $(':button').off("click");
  $(window).off("keypress");
  LOG_END_TIME = new Date().getTime();
  choice = click_event.val();
  truth = TRIAL_CONFIG[SLIDE_TYPE]["hypo"][TRIAL_COUNT];
  // console.log("choice =", choice, "; truth =", truth);
  SCORE_MEMORY.shift();
  update_score(choice, truth);
  if (SLIDE_TYPE == "guide") {
    show_neutral_feedback();
  } else {
    show_corrective_feedback(choice, truth);
  };
  log_trial_data(choice);
  TRIAL_COUNT += 1;
  frac = fraction_score(SCORE_MEMORY);
  // console.log(frac);
  trials_end(frac, TRIAL_COUNT);   //can add to SLIDES
};

function reset_score(max) {
  SCORE_MEMORY = [];
  for (var i=0; i<max; i++) {SCORE_MEMORY.push(0)};
};

function update_score(choice, truth) {
  if (choice == truth) {SCORE_MEMORY.push(1)}
  else {SCORE_MEMORY.push(0)};
};

function show_corrective_feedback(choice, truth) {
  if (choice == truth) {
    $("#trial_text").append($("<p align='center' class='feedback-text'>").
      html(`<br>Correct`).css("color", "green"));
  } else {
    $("#trial_text").append($("<p align='center' class='feedback-text'>").
      html(`<br>Incorrect`).css("color", "red"));
  };
};

function show_neutral_feedback() {
  $("#trial_text").append($("<p align='center' class='feedback-text'>").
    html(`<br>Choice received`).css("color", "gray"));
};

function log_trial_data(choice) {
// bad form
  var trial_data = {trial_type: SLIDE_TYPE,
    trial_number: TRIAL_COUNT,
    response: choice,
    answer: TRIAL_CONFIG[SLIDE_TYPE]["hypo"][TRIAL_COUNT],
    clicked_pos: CLICKED_LIN_IND,
    clicked_times: CLICKED_TIMES,
    pattern: TRIAL_CONFIG[SLIDE_TYPE]["pattern"][TRIAL_COUNT],
    max_clicks: [],
    guidance: [],
    trial_start_time: LOG_START_TIME,
    trial_end_time: LOG_END_TIME,
    trail_time: LOG_END_TIME - LOG_START_TIME
  };
  if (SLIDE_TYPE == "explo") {
    trial_data["max_clicks"]
      .push(TRIAL_CONFIG[SLIDE_TYPE]["trial_max_clicks"][TRIAL_COUNT]);
  };
  if (SLIDE_TYPE == "guide") {
    trial_data["max_clicks"]
      .push(TRIAL_CONFIG[SLIDE_TYPE]["trial_max_clicks"][TRIAL_COUNT]);
    trial_data["guidance"]
      .push(TRIAL_CONFIG[SLIDE_TYPE]["guidance"][TRIAL_COUNT]);
  };
  EXP.data.push(trial_data);
}

function trials_end(score, ind) {
  var max_score, max_ind, next_button;
  next_button = $("<button>").text("Next").
    one("click", function() {show_next_slide(SLIDES)});
  max_score = TRIAL_CONFIG[SLIDE_TYPE]["score_thresh"];
  max_ind = TRIAL_CONFIG[SLIDE_TYPE]["max_trials"];
  if (score >= max_score || ind == max_ind) {
    setTimeout(function() {
      $("#trial_slide").append($("<p>").append(next_button))},
      FEEDBACK_WAIT_TIME);
  } else if (ind < max_ind) {
    setTimeout(function() {
      add_slide(SLIDE_TYPE, ind);
      show_next_slide(SLIDES)
      }, FEEDBACK_WAIT_TIME);
  };
};

function survey_constructor(in_text) {
  var slide, text, submit_button;
  submit_button = $("<button>").text("Submit to Turk")
    .click(function() {exp_end()});
  slide = $("<div class='slide' id='survey_slide' >");
  text = $("<div class='block-text' id='survey_text'>");
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
    // store survey data
    survey_data = {about: $('#about').val(),
      external_aid: $('#external_aid').val(),
      better: $('#better').val(),
      unclear: $('#unclear').val(),
      comment: $('#comments').val(),
      age: $('#age').val(),
      gender: $('#gender').val(),
      turkSubmitTo: turk.turkSubmit
    };
    EXP.survey.push(survey_data);
    // store timing data
    time_data = {INSTRUCTION_WAIT_TIME: INSTRUCTION_WAIT_TIME,
      FEEDBACK_WAIT_TIME: FEEDBACK_WAIT_TIME
    };
    EXP.time.push(time_data);
    // store configs
    config_data = {PATTERN: PATTERN,
      TRIAL_CONFIG: TRIAL_CONFIG
    };
    EXP.config.push(config_data);
    // store text
    EXP.instruction.push(TEXT);
    setTimeout(function() {turk.submit(EXP)}, 500);
  } else {
    text.append($("<p style='color:red'>").html('Please answer the \
      first question before submtting.'));
  };
};

//####################
// board functions
//####################
function board_configure(gBoard) {
  $('#gBoard').css("border-collapse", "separate");
  $('#gBoard').css("border-spacing", "1px");
  $('#gBoard').css("background-color", "gray");

  gBoard.cell("each").style({
    width: CELL_SIZE + "px",
    height: CELL_SIZE + "px",
    background: "lightgray",
    borderRadius: "0px"
  });
};

function board_key_configure(gBoard) {
  var bind_key = [
    jsboard.piece({ text: "7", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "8", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "9", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "0", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "u", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "i", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "o", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "p", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "j", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "k", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "l", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: ";", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "n", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: "m", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: ",", fontSize: "15px", textAlign: "center" }),
    jsboard.piece({ text: ".", fontSize: "15px", textAlign: "center" })
  ];
  for (var i=0; i<bind_key.length; i++) {
    var mat_ind = matrixIndex(i);
    gBoard.cell(mat_ind).place(bind_key[i].clone());
  };
};

function key2ind(event) {
    if (event.which == 55) {return 0}; //_7
    if (event.which == 56) {return 1}; //_8
    if (event.which == 57) {return 2}; //_9
    if (event.which == 48) {return 3}; //_0
    if (event.which == 117) {return 4}; //u
    if (event.which == 105) {return 5}; //i
    if (event.which == 111) {return 6}; //o
    if (event.which == 112) {return 7}; //p
    if (event.which == 106) {return 8}; //j
    if (event.which == 107) {return 9}; //k
    if (event.which == 108) {return 10}; //l
    if (event.which == 59) {return 11}; //;
    if (event.which == 110) {return 12}; //n
    if (event.which == 109) {return 13}; //m
    if (event.which == 44) {return 14}; //,
    if (event.which == 46) {return 15}; //.
};

function board_show(gBoard, pattern) {
  for (var i=0; i<pattern.length; i++) {
    show_label(gBoard, pattern, i);
  };
  $('#row_buttons').append(make_hypo_buttons());
  enable_hypo_keypress();
};

function board_explore(gBoard, pattern) {
  var max_count, lin_ind;
  max_count = TRIAL_CONFIG[SLIDE_TYPE]["trial_max_clicks"][TRIAL_COUNT];
  // by key press
  $(window).on("keypress", function(event) {
    lin_ind = key2ind(event);
    increment_click(lin_ind);
    if (CLICK_COUNT <= max_count) {show_label(gBoard, pattern, lin_ind)};
    check_show_hypo(max_count);
  });
  // by clicks
  gBoard.cell("each").on("click", function() {
    lin_ind = linearIndex(gBoard.cell(this).where());
    increment_click(lin_ind);
    if (CLICK_COUNT <= max_count) {show_label(gBoard, pattern, lin_ind)};
    check_show_hypo(max_count);
  });
};

function board_guide(gBoard, pattern) {
  var max_count, guidance, lin_ind;
  max_count = TRIAL_CONFIG[SLIDE_TYPE]["trial_max_clicks"][TRIAL_COUNT];
  guidance = TRIAL_CONFIG[SLIDE_TYPE]["guidance"][TRIAL_COUNT];
  show_guide(gBoard, guidance[CLICK_COUNT]);
  // by key press
  $(window).on("keypress", function(event) {
    lin_ind = key2ind(event);
    if (lin_ind == guidance[CLICK_COUNT]) {
      increment_click(lin_ind);
      if (CLICK_COUNT <= max_count) {show_label(gBoard, pattern, lin_ind)};
      if (CLICK_COUNT < max_count) {show_guide(gBoard, guidance[CLICK_COUNT])};
      check_show_hypo(max_count);
    };
  });
  // by clicks
  gBoard.cell("each").on("click", function() {
    lin_ind = linearIndex(gBoard.cell(this).where());
    if (lin_ind == guidance[CLICK_COUNT]) {
      increment_click(lin_ind);
      if (CLICK_COUNT <= max_count) {show_label(gBoard, pattern, lin_ind)};
      if (CLICK_COUNT < max_count) {show_guide(gBoard, guidance[CLICK_COUNT])};
      check_show_hypo(max_count);
    };
  });
};

function increment_click(lin_ind) {
  if (!is_in_list(lin_ind, CLICKED_LIN_IND)) {
    CLICK_COUNT += 1;
    CLICKED_LIN_IND.push(lin_ind);
    CLICKED_TIMES.push(new Date().getTime());
  };
};

function show_label(gBoard, pattern, lin_ind) {
  var mat_ind;
  mat_ind = matrixIndex(lin_ind);
  if (pattern[lin_ind] == 1) {
    gBoard.cell(mat_ind).style({background:"black"});
  } else if (pattern[lin_ind] == 0) {
    gBoard.cell(mat_ind).style({background:"white"});
  };
};

function show_guide(gBoard, guide_ind) {
  var mat_ind = matrixIndex(guide_ind);
  gBoard.cell(mat_ind).style({background:"orange"});
};

function check_show_hypo(max_count){
  if (CLICK_COUNT == max_count) {
    CLICK_COUNT = 999; //hack
    $('#row_buttons').append(make_hypo_buttons()); //leads to hypo_feedback
    enable_hypo_keypress();
  };
};

function print_click_history() {
  console.log("click", CLICK_COUNT, "/", max_count);
  console.log("recorded clicks:", CLICKED_LIN_IND);
};

function make_hypo_buttons() {
  var hypo_buttons, sub_buttons;
  hypo_buttons = [];
  for (var i=0; i<HYPO_NAME.length; i++) {
    var sub_buttons;
    sub_buttons = $("<button class='btn btn-default " + HYPO_NAME[i] +
        "' value = '" + HYPO_NAME[i] + "'>")
        .text(HYPO_NAME[i] + "(" + (i+1) + ")")
        .one("click", function() {hypo_feedback($(this))});
     hypo_buttons.push(sub_buttons);
  }
  return hypo_buttons;
};

function enable_hypo_keypress() {
  $(window).on("keypress", function(event) {
    if (event.which == 49) {hypo_feedback($("button." + HYPO_NAME[0]))}; //1
    if (event.which == 50) {hypo_feedback($("button." + HYPO_NAME[1]))}; //2
    if (event.which == 51) {hypo_feedback($("button." + HYPO_NAME[2]))}; //3
    if (event.which == 52) {hypo_feedback($("button." + HYPO_NAME[3]))}; //4
  });
};

function linearIndex(mat_ind) {
  return mat_ind[0]*BOARD_SIZE + mat_ind[1];
};

function matrixIndex(lin_ind) {
  var div = Math.floor(lin_ind/4);
  var rem = lin_ind % 4;
  return [div, rem];
};

function is_in_list(ele, list) {
  for (var i=0; i<list.length; i++) {
    if (ele == list[i])
      return true;
  } return false;
};

//####################
// score bar
//####################
var SCORE_BAR_W = 100; //px
var SCORE_BAR_H = 20; //px
var SCORE_BAR = $("<canvas id='score' align='center'>");

function fraction_score(memory) {
  var frac, max;
  frac = 0;
  max = memory.length;
  for (var i=0; i<max; i++){
    frac += memory[i];
  }
  frac = frac/max;
  return frac;
};

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
  frac = fraction_score(SCORE_MEMORY);
  ctx.beginPath();
  ctx.rect(0, 0, frac*SCORE_BAR_W, SCORE_BAR_H);
  ctx.fillStyle = 'green';
  ctx.fill();
  //show score as text
  ctx.fillStyle = 'white';
  ctx.font = 0.7*SCORE_BAR_H + "px Arial";
  ctx.fillText(Math.ceil(frac*100) + "%",
    SCORE_BAR_W/2, SCORE_BAR_H - 0.1*SCORE_BAR_H);
  // console.log("Score bar udpated.");
};

function draw_score_blank() {
  var c = document.getElementById("score");
  var ctx = c.getContext("2d");
  //set canvas size
  c.width = SCORE_BAR_W
  c.height = SCORE_BAR_H
  // draw bar
  ctx.beginPath();
  ctx.rect(0, 0, SCORE_BAR_W, SCORE_BAR_H);
  ctx.fillStyle = 'white';
  ctx.fill();
};

//####################
// teaching - better as a class (refactor)
//####################
var QUAD = [[0,1,4,5],[2,3,6,7],[8,9,12,13],[10,11,14,15]];

function choose_adjacent_quad(ind) {
  var adj_quad, quad_ind, pool;
  adj_quad = [[],[],[],[]];
  //adj_quad[i] gives all lin_inds that are adjacent to quad_i
  adj_quad[0] = adj_quad[0].concat(QUAD[1], QUAD[2]);
  adj_quad[1] = adj_quad[1].concat(QUAD[0], QUAD[3]);
  adj_quad[2] = adj_quad[2].concat(QUAD[0], QUAD[3]);
  adj_quad[3] = adj_quad[3].concat(QUAD[1], QUAD[2]);
  quad_ind = which_quad(ind);
  pool = _.shuffle(adj_quad[quad_ind]);
  return pool[0];
};

function choose_diagonal_quad(ind) {
  var diag_quad, quad_ind, pool;
  diag_quad = [[],[],[],[]];
  //diag_quad[i] gives all lin_inds that are diagonal to quad_i
  diag_quad[0] = QUAD[3];
  diag_quad[1] = QUAD[2];
  diag_quad[2] = QUAD[1];
  diag_quad[3] = QUAD[0];
  quad_ind = which_quad(ind);
  pool = _.shuffle(diag_quad[quad_ind]);
  return pool[0];
};

function choose_current_quad(ind) {
  var quad_ind, pool;
  quad_ind = which_quad(ind);
  pool = _.shuffle(QUAD[quad_ind]);
  if (pool[0] == ind) {
    return pool[1];
  } else {
    return pool[0];
  };
};

function choose_diagonal_in_quad(ind) {
    var diag_moves;
    //diag_moves[i] = the lin_ind diagonal to i in the same quad
    diag_moves = [5,4,7,6,1,0,3,2,13,12,15,14,9,8,11,10];
    return diag_moves[ind];
};

function which_quad(ind) {
  for (var i=0; i<4; i++) {
    if (QUAD[i].indexOf(ind) >= 0) {
      return i;
    };
  };
};

function random_guide(hypo, max_count) {
  var temp, guidance;
  temp = [];
  guidance = [];
  for (var i=0; i<15; i++) {temp.push(i)};
  temp = _.shuffle(temp);
  for (var i=0; i<max_count; i++) {guidance.push(temp[i])};
  return guidance;
};

function discrete_rand(min, max) {
  return Math.floor(Math.random()*(max - min + 1)) + min;
};


//####################
// trials
//####################
var PATTERN, TRIAL_CONFIG;

PATTERN = [
// hypo 1
[[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
[1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0]],
// hypo 2
[[0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
[1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0]],
// hypo 3
[[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
[1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
[0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
[1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
[0,0,1,1,0,0,1,1,1,1,0,0,1,1,0,0],
[1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1]],
// hypo 4
[[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
[1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
[0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
[1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
[0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1],
[0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
[1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1],
[1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0],
[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
[0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
[1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1],
[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]],
];

TRIAL_CONFIG = {learn: {}, explore: {}, guide: {}};
TRIAL_CONFIG["learn"] = {hypo: [], pattern: [],
  trial_max_clicks: [], guidance: []};  // last two are dummy
TRIAL_CONFIG["explo"] = {hypo: [], pattern: [],
  trial_max_clicks: [], guidance: []}; // last one is dummy
TRIAL_CONFIG["guide"] = {hypo: [], pattern: [],
  trial_max_clicks: [], guidance: []};

TRIAL_CONFIG["learn"]["max_trials"] = 1; //220;
TRIAL_CONFIG["learn"]["max_clicks"] = 0; //dummy
TRIAL_CONFIG["learn"]["min_clicks"] = 0; //dummy
TRIAL_CONFIG["learn"]["memory_limit"] = 30;
TRIAL_CONFIG["learn"]["score_thresh"] = 0.7;
set_trial_config("learn");

TRIAL_CONFIG["explo"]["max_trials"] = 220;
TRIAL_CONFIG["explo"]["max_clicks"] = 8;
TRIAL_CONFIG["explo"]["min_clicks"] = 2;
TRIAL_CONFIG["explo"]["memory_limit"] = 30;
TRIAL_CONFIG["explo"]["score_thresh"] = 0.7;
set_trial_config("explo");

TRIAL_CONFIG["guide"]["max_trials"] = 1; //110;
TRIAL_CONFIG["guide"]["max_clicks"] = 2;
TRIAL_CONFIG["guide"]["min_clicks"] = 2;
TRIAL_CONFIG["guide"]["memory_limit"] = 20;
TRIAL_CONFIG["guide"]["score_thresh"] = 0.85;
set_trial_config("guide");

function set_trial_config(type) {
  var ihypo, ipattern, min_cl, max_cl;
  for (var i=0; i<TRIAL_CONFIG[type]["max_trials"]; i++) {
    ihypo = discrete_rand(1, 4);
    ipattern = discrete_rand(0, PATTERN[ihypo-1].length-1);
    min_c = TRIAL_CONFIG[type]["min_clicks"];
    max_c = TRIAL_CONFIG[type]["max_clicks"];
    nclicks = discrete_rand(min_c, max_c);
    TRIAL_CONFIG[type]["hypo"].push(HYPO_NAME[ihypo-1]);
    TRIAL_CONFIG[type]["pattern"].push(PATTERN[ihypo-1][ipattern]);
    TRIAL_CONFIG[type]["trial_max_clicks"].push(nclicks);
    TRIAL_CONFIG[type]["guidance"].push(optimal_teach(ihypo));
  };
};

// console.log(TRIAL_CONFIG["guide"]["hypo"])
// console.log(TRIAL_CONFIG["guide"]["guidance"])


function optimal_teach(hypo) {
  // currently only for exactly two steps
  var guidance = [0,0];
  guidance[0] = discrete_rand(0, 15);
  if (hypo == 1 || hypo == 2) {
    guidance[1] = choose_adjacent_quad(guidance[0]);
  } else if (hypo == 3) {
    guidance[1] = choose_diagonal_quad(guidance[0]);
  } else if (hypo == 4) {
    guidance[1] = choose_diagonal_in_quad(guidance[0]);
  }
  return guidance;
};

//####################
// balanced trials (under constrction)
//####################
//next: incorporate expected freq
var HYPO_ID_SEQ = [1,1,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4];
var PATTERN_ID_SEQ = [0,1,0,1,0,1,2,3,4,5,0,1,2,3,4,5,6,7,8,9,10,11];

function shuffle_together(arr1, arr2) {
  var n1, n2, dummy, shuf1, shuf2;
  dummy = [];
  shuf1 = [];
  shuf2 = [];
  n1 = arr1.length;
  n2 = arr2.length;
  if (n1 != n2) {return []};
  for (var i=0; i<n1; i++) {dummy.append(i)};
  dummy = _.shuffle(dummy);
  for (var i=0; i<n1; i++) {
    shuf1.append(arr1[dummy[i]]);
    shuf2.append(arr2[dummy[i]]);
  };
  return [shuf1, shuf2];
}

function duplicate_then_shuffle_together(arr1, arr2) {
  var dup1, dup2;
  dup1 = arr1.concat(arr1);
  dup2 = arr2.concat(arr2);
  return shuffle_together(dup1, dup2);
}

//####################
// text
//####################
var TEXT = {};

TEXT["welcome"] = ["<p>In this experiment, we are interested \
  in how much guided exploration can help people learn abstract concepts. \
  The experiment has two parts. \
  First, you will play a classification game and learn 4 classes of patterns. \
  Then, you will play a harder version of the game by \
  following the guidance of the best teacher for the task. \
  The whole experiment will take roughly 5-10 minutes.</p>",

  "<p>(Note: you won't be able to preview this HIT before \
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

TEXT["prior_learn"] = ["<p>Please read the following instructions \
  carefully.</p>",

  "<p>In this first part, \
  you will see patterns composed of black and white squares on a 4-by-4 grid. \
  There are four &#34concepts,&#34 named H1, H2, H3, and H4. \
  Each concept consists of multiple patterns, \
  and some patterns are shared by more than one concepts.</p>",

  "<p>The goal here is to learn which patterns are associated \
  with which concepts and at what frequency. \
  After a pattern is displayed, you can respond by clicking \
  on a button (labelled H1, H2, H3, or H4), or by using the keyboard \
  (pressing 1, 2, 3, or 4). \
  Upon making a choice, you will receive a feedback on correctness. \
  You will advance to the next part when \
  you can distinguish the concepts with "
   + Math.floor(TRIAL_CONFIG["learn"]["score_thresh"]*100) +
  "% accuracy or when you use up all "
  + TRIAL_CONFIG["learn"]["max_trials"] + " of the available trials. \
  Try to finish this part in as few trials as possible. </p>",

  "<p>Please click Next after you have read the instructions.</p>"
];

TEXT["optimal_teach"] = ["<p>Please read the following instructions \
  carefully.</p>",

  "<p>In this second part, the game will be a little different. \
  The pattern will now be covered by gray squares, \
  and you will reveal the hidden pattern one square at a time. \
  A teacher who knows the <b>correct answer</b> has figured out the \
  <b>best way</b> to help you get to the correct choice of concept. \
  It turns out that only two openings are needed to do this. \
  The teacher will thus highlight in sequence which two gray squares to open, \
  and you can open a highlighted square by clicking on it or by using the \
  keyboard (pressing the key labelled on the square).</p>",

  "<p>Unlike the first part, no feedback on correctness will be given, \
  although score will be kept behind the scene. \
  You will advance to the submission phase when you reach "
   + Math.floor(TRIAL_CONFIG["guide"]["score_thresh"]*100) +
  "% accuracy or when you use up all "
  + TRIAL_CONFIG["guide"]["max_trials"] + " of the available trials. \
  Again, try to finish in as few trials as possible. </p>",

  "<p>Please click Next after you have read the instructions.</p>"
];

TEXT["learn_trial"] = ["<p>The Next button will appear once you reach "
  + 100*TRIAL_CONFIG["learn"]["score_thresh"] + "% in accuracy \
  or once you used up all "
  + TRIAL_CONFIG["learn"]["max_trials"] + " trials.</p>"
];

TEXT["explo_trial"] = ["<p>The Next button will appear once you reach "
  + 100*TRIAL_CONFIG["explo"]["score_thresh"] + "% in accuracy \
  or once you used up all "
  + TRIAL_CONFIG["explo"]["max_trials"] + " trials.</p>"
];

TEXT["guide_trial"] = ["<p>The Next button will appear once you reach "
  + 100*TRIAL_CONFIG["guide"]["score_thresh"] + "% in accuracy \
  or once you used up all "
  + TRIAL_CONFIG["guide"]["max_trials"] + " trials.</p>"
];

TEXT["survey"] = ["<p>Thank you for taking our HIT. \
    Please answer the following questions.",

  "<p>What was this experiment about? <br> \
    <input type='text' id='about' name='about' size='70'>",

  "<p>Did you use any external learning aids (e.g. pencil and paper)? <br> \
    <input type='text' id='external_aid' name='external_aid' size='70'>",

  "<p>How can we make this experiment better? \
    <br> <input type='text' id='better' name='better' size='70'>",

  "<p>Was anything unclear? <br> \
    <input type='text' id='unclear' name='unclear' size='70'>",

  "<p>Any other comments for us? <br> \
    <input type='text' id='comments' name='comments' size='70'>",

  "<p>What is your age? <br> \
    <input type='text' id='age' name='age' size='20'>",

  "<p>What is your gender? (m = male, f = female, o = other) <br> \
    <input type='text' id='gender' name='gender' size='20'>"
];

//####################
// slides
//####################
var SLIDES = [];

SLIDES.unshift({ name: "welcome", type: "instruction",
  text: TEXT["welcome"],
  constructor: instruction_constructor});
SLIDES.unshift({ name: "prior_learn", type: "instruction",
  text: TEXT["prior_learn"],
  constructor: instruction_constructor});
SLIDES.unshift({name: "learn", type: "learn", text: TEXT["learn_trial"],
  pattern: TRIAL_CONFIG["learn"]["pattern"][0],
  constructor: trial_constructor});
SLIDES.unshift({ name: "optimal_teach", type: "instruction",
  text: TEXT["optimal_teach"],
  constructor: instruction_constructor});
SLIDES.unshift({name: "guide", type: "guide", text: TEXT["guide_trial"],
  pattern: TRIAL_CONFIG["guide"]["pattern"][0],
  guidance: TRIAL_CONFIG["guide"]["guidance"][0],
  constructor: trial_constructor});
SLIDES.unshift({ name: "survey", type: "instruction",
  text: TEXT["survey"],
  constructor: survey_constructor});
// console.log("Done initializing SLIDES.")

// refactor the repeat
function add_slide(slide_type, ind) {
  if (slide_type == "learn") {
    SLIDES.push({name: "learn", type: "learn", text: TEXT["learn_trial"],
      pattern: TRIAL_CONFIG["learn"]["pattern"][ind],
      constructor: trial_constructor});
  };
  if (slide_type == "explore") {
    SLIDES.push({name: "explo", type: "explo", text: TEXT["explo_trial"],
      pattern: TRIAL_CONFIG["explo"]["pattern"][ind],
      constructor: trial_constructor});
  };
  if (slide_type == "guide") {
    SLIDES.push({name: "guide", type: "guide", text: TEXT["guide_trial"],
      pattern: TRIAL_CONFIG["guide"]["pattern"][ind],
      guidance: TRIAL_CONFIG["guide"]["guidance"][ind],
      constructor: trial_constructor});
  };
  // console.log("Slide added.")
};

function show_next_slide() {
  var next_slide;
  $(".slide").remove();
  next_slide = SLIDES.pop();
  SLIDE_TYPE = next_slide.type;
  // console.log("Going on to construct slide.");
  if (next_slide.type == "instruction") {
    next_slide.constructor(next_slide.text);
  } else {
    next_slide.constructor( next_slide.text, next_slide.pattern);
  };
};

//####################
// start domino!!
//####################
var EXP = {data: [], survey: [], time: [], config: [], instruction: []};
show_next_slide(SLIDES)


//####################
// require example
//####################
// require.config({
//     "packages": ["js/permutate"]
// });
//
// require(["js/permutate"], function (permutate) {
//   var seq = [0,0,1,1]; //must be sorted from smallest to biggest first
//   while(seq) {
// 	   console.log(seq);
// 	    seq = permutate.next(seq);
//   }
// });
