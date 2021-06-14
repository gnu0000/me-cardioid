// cardioid.js  
//
// A canvas toy
// Craig Fitzgerald
// https://en.wikipedia.org/wiki/Cardioid
//
//
//You can specify params via the url:
//http://craig/toys/cardioid/cardioid.html?factor=23
//http://craig/toys/cardioid/cardioid.html?linethickness=10&pointsize=0
//http://craig/toys/cardioid/cardioid.html?factor=99&points=250&maxpoints=1500&interval=55&pointsize=75&linethickness=1&pointcolor=cyan
//http://craig/toys/cardioid/cardioid.html?points=500&factor=20&deltafactor=0.05&linethickness=1&pointsize=0

$(function() {
   var page = new PageHandler($("#petridish"));
});

function PageHandler(canvas, options){
   var self = this;

   this.Init = function(canvas, options){
      self.InitAttributes(canvas, options);
      self.InitEvents();
      self.InitState();
   };

   this.InitAttributes = function(canvas, options){
      self.canvas    = $(canvas).get(0);
      self.ctx       = self.canvas.getContext('2d');
      self.step      = 0;
      self.points    = 0;
      self.factor    = 0;
      self.interval  = 0;
      //self.pauseMode = 0;
      self.defaults = {
         points        :   0,
         maxpoints     : 500,
         factor        :   2,
         interval      :  40,
         startpaused   :   0,
         pointsize     :   2,
         linethickness :   2,
         deltafactor   :   0,
         pointcolor    : "white",
         fgHue         : self.Random(360),
         bgHue         : self.Random(360),
         bgHueGap      : self.Random(270) + 45
      };
      self.opt = $.extend({}, self.defaults, options || {});
      self.AddUrlParams();
      self.NormalizeOptions();
      self.points = self.opt.points;
      self.factor = self.opt.factor;
   };

   this.InitEvents = function(){
      document.oncontextmenu = function(){return false};
      $(window).keydown(self.KeyDown).resize(self.Resize);
      $("button").click(self.HandleButton);
      $("input").change(this.HandleVals);
   };

   this.InitState = function(){
      self.Resize();
      self.Go();
   };

   this.Go = function(go = true){
      if (go){
         if (!self.interval) self.interval = setInterval(self.Step, self.opt.interval);
         return;
      } 
      if (self.interval) clearInterval(self.interval);
      self.interval = 0;
   };

   this.Resize = function(){
      for (var i of [1,2]) {
         var x = $(window).width() ;
         var y = $(window).height();
         $('body').width (x);
         $('body').height(y);
         $(self.canvas).width (x);
         $(self.canvas).height(y);
         self.canvas.width  = x;
         self.canvas.height = y;
         self.center = {x: x/2, y: y/2 - 20};
         self.radius = Math.round(Math.min(x/2, y/2) - 30 - self.opt.pointsize);
      };
   };

   this.Step = function(deltastep = 1){
      self.deltastep = deltastep;
      requestAnimationFrame(self._Step);
   }

   this._Step = function(){
      self.Update();
      self.step++;
      self.opt.fgHue += 0.25;
      self.opt.bgHue -= 0.1;
      var h = self.opt.bgHueGap;
      self.fgColor   = self.HSL (self.opt.fgHue  , "75%", "50%");
      self.bgColor0  = self.HSL (self.opt.bgHue+h, "65%", "15%");
      self.bgColor1  = self.HSL (self.opt.bgHue  , "65%", "15%");
      self.Draw();
   };

/*
   this.Update = function(){
      if (self.opt.deltafactor == 0) {
         self.points++;
         self.points = self.points % (self.opt.maxpoints + self.factor * 2);
      } else {
         self.factor += self.opt.deltafactor;
      }
   };
*/

   this.Update = function(){
      if (self.opt.deltafactor == 0) {
         self.points = Math.max(2, self.points + self.deltastep);
         self.points = self.points % (self.opt.maxpoints + self.factor * 2);
      } else {
         self.factor += self.opt.deltafactor * self.deltastep;
      }
   };

   this.Draw = function(){
      self.DrawBackground();
      self.DrawGrid();
      self.DrawLines();
      self.DebugInfo();
   };

   this.DrawBackground = function(){
      self.bkgGradient = self.ctx.createLinearGradient(0, 0, 0, self.canvas.height);
      self.bkgGradient.addColorStop(0, self.bgColor0);
      self.bkgGradient.addColorStop(1, self.bgColor1);
      self.ctx.fillStyle = self.bkgGradient;
      self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
   };

   this.DrawGrid = function(){
      self.DrawCircle({x:self.center.x, y:self.center.y}, self.radius, self.opt.linethickness, self.fgColor);
      for (var i = 0; i < self.points; i++) {
         self.DrawCircle(self.Center(i), self.opt.pointsize, self.opt.linethickness, self.opt.pointcolor);
      }
   };

   this.DrawLines = function(){
      for (var i = 0; i < self.points; i++) {
         let p1 = self.Center(i);
         let p2 = self.Center(i * self.factor);
         self.DrawLine(p1, p2, self.opt.linethickness, self.fgColor);
      };
   };

   this.Center = function(point) {
      point = point % self.points;
      let a = point * (2 * Math.PI)/self.points - Math.PI / 2;
      let x = Math.round(self.center.x + self.radius * Math.cos(a));
      let y = Math.round(self.center.y + self.radius * Math.sin(a));
      return {x, y};
   };

   this.DrawCircle = function(center, radius, lineWidth, color) {
      self.ctx.beginPath();
      self.ctx.strokeStyle = color;
      self.ctx.lineWidth = lineWidth;
      self.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      self.ctx.stroke();
   };

   this.DrawLine = function(p1, p2, lineWidth, color) {
      self.ctx.beginPath();
      self.ctx.strokeStyle = color;
      self.ctx.lineWidth = lineWidth;
      self.ctx.moveTo(p1.x, p1.y);
      self.ctx.lineTo(p2.x, p2.y);
      self.ctx.stroke();
   };

   this.HandleButton = function(e) {
      let options = $(e.target).data("val");
      self.opt = $.extend({}, self.defaults, options || {});
      self.NormalizeOptions();
      self.Go(!self.opt.startpaused);
      if (self.opt.startpaused) self.NextFrame(1);
   };

   this.NormalizeOptions = function() {
      for (var name in self.opt) {
         let val = self.opt[name];
         if ((typeof val === 'string' || val instanceof String) && val.match(/^\d/))
            val = val - 0;
         self.opt[name] = val;
      }
      self.points = self.opt.points;
      self.factor = self.opt.factor;
   };

   this.AddUrlParams = function() {
      for (var name in self.opt) {
         self.opt[name] = self.UrlParam(name, self.opt[name]);
      }
   };

   this.KeyDown = function (event) {
      let e = event.originalEvent;
      if (e.which > 111) return;
      let shift = e.shiftKey;
      e.preventDefault();
      
      switch(e.which){
         case 32: return self.TogglePause();         // space - pause
         case 37: return self.NextFrame(-1, shift);  // left  - previous frame
         case 38: return self.SpeedBump(1 , shift);  // up    - faster
         case 39: return self.NextFrame(1 , shift);  // right - next frame
         case 40: return self.SpeedBump(-1, shift);  // down  - slower

         case 68: return $("#debug-info").toggle();  // d - debug info
         case 72: return $("#help").toggle();        // h - help
         case 82: return self.NormalizeOptions();    // r - reset
         case 86: return self.ShowVals();            // v - show vals
         case 107:return self.SpeedBump(1, shift);   // + - faster
         case 109:return self.SpeedBump(-1, shift);  // - - slower
      }
      if (e.which > 48 && e.which <= 57){            // # - quick set factor
         self.opt.factor = e.which - 48;
         self.opt.deltafactor = 0;
         return self.NormalizeOptions();
      }                    
   };

   this.TogglePause = function(){
      self.Go(!self.interval);
   };

   this.NextFrame = function(dir, shift = false){
      let size = shift ? 5 : 1;
      let delta = dir > 0 ? size : -size;
      self.Go(false);
      self.Step(delta);
   };

   this.SpeedBump = function(dir, shift){
      let scale = dir > 0 ? (shift ? 1.6 : 1.1) : (shift ? 0.6 : 0.9);
      self.opt.interval = Math.floor(self.opt.interval / scale);
      self.TogglePause();
      self.TogglePause();
   };

   this.ShowVals = function() {
      $("#vals-div").toggle();
      $("#points"     ).val(self.points         ).focus();
      $("#factor"     ).val(self.factor         );
      $("#maxpoints"  ).val(self.opt.maxpoints  );
      $("#interval"   ).val(self.opt.interval   );
      $("#deltafactor").val(self.opt.deltafactor);
      $("#pointsize"  ).val(self.opt.pointsize  );
      return false;
   };

   this.HandleVals = function() {
      self.points          = $("#points"     ).val() - 0;
      self.factor          = $("#factor"     ).val() - 0;
      self.opt.maxpoints   = $("#maxpoints"  ).val() - 0;
      self.opt.interval    = $("#interval"   ).val() - 0;
      self.opt.deltafactor = $("#deltafactor").val() - 0;
      self.opt.pointsize   = $("#pointsize"  ).val() - 0;
      $("#vals-div").hide();
      self.TogglePause();
      self.TogglePause();
   };

   this.DebugInfo = function() {
      let f = self.factor.toFixed(3);
      $("#debug-info").text(`points:${self.points} factor:${f}`);
      $("#points"    ).val(self.points);
      $("#factor"    ).val(self.factor);
   };

   this.HSL = function(h, s, l){
      return 'hsl('+h+','+s+','+l+')';
   };

   this.UrlParam = function(name, defaultVal){
      var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
      return results ? decodeURIComponent(results[1]) : defaultVal;
   };

   this.Random = function (max){
      return Math.floor(Math.random() * max);
   };

   this.Init(canvas, options);
};
