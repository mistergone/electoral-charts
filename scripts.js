var data = [],
    weights = {
      population: {},
      eligible: {},
      votingage: {},
      turnout: {}
    };

function commaSeparate( numberString ) {

  var string = numberString.toString(),
      // split string of number by the decimal point
      parts = string.split( '.' ),
      // format the whole number part of the string with a regex
      formattedValue = parts[0].replace( /(\d)(?=(\d{3})+(?!\d))/g, '$1,' );
  // Add back decimal part if it exists
  if ( typeof parts[1] !== 'undefined' ) {
    formattedValue += '.' + parts[1];
  }

  return formattedValue;

}

function parseText( string ) {
	var arr = string.split( ',' )
			obj = {};
	for ( var x=0; x < arr.length; x++ ) {
		var line = arr[x].split( ':' ),
				key = line[0].trim(),
				value = line[1].trim();
		obj[key] = value;
	}

	return obj;
}

function renderTable( ) {

  for ( var x=0; x < data.length; x++ ) {
    var row = data[x],
        rowHtml = '<tr>',
        population = row.population.replace(/\D/g,''),
        ratio = commaSeparate( Math.round( population / (+row.electors) ) );

    rowHtml += '<td class="cell_state"><strong>' + row.state + '</strong></td>';
    rowHtml += '<td class="cell_centered cell_electors">' + row.electors + '</td>';
    rowHtml += '<td class="cell_centered cell_population">' + commaSeparate( row.population ) + '</td>';
    rowHtml += '<td class="cell_centered cell_ratio">' + commaSeparate( Math.round( row.population / row.electors ) ) + '</td>';
    rowHtml += '<td class="cell_centered cell_votingage">' + commaSeparate( row.votingage );
    rowHtml += ' (' + Math.round( row.votingage / row.population * 100 )  + '%)</td>';
    rowHtml += '<td class="cell_centered cell_eligible">' + commaSeparate( row.eligible );
    rowHtml += ' (' + Math.round( row.eligible / row.population * 100 )  + '%)</td>';
    rowHtml += '<td class="cell_centered cell_turnout">' + commaSeparate( row.turnout );
    rowHtml += ' (' + Math.round( row.turnout / row.eligible * 100 )  + '%)</td>';
    rowHtml += '</tr>'
    $( '#tabular tbody' ).append( rowHtml );
  }
}

function fillWeights() {
  var keys = ['population', 'eligible', 'votingage', 'turnout' ];
  $.each( data, function() {
    for ( var x=0; x < keys.length; x++ ) {
      weights[keys[x]][this.state] = this[keys[x] + 'weight'];
    }
  } );
}

function compareIt( dataset ) {
  var baseState = $( '#base-state option:selected' ).val(),
      comparedState = $( '#compared-state option:selected' ).val(),
      baseWeight = weights[dataset][baseState],
      comparedWeight = weights[dataset][comparedState],
      voteRatio = ( baseWeight / comparedWeight ),
      voteText = " voters";

  voteRatio = Math.round( ( voteRatio * 100 ) ) / 100;

  if ( voteRatio === 1 ) {
    voteText = " voter";
  }

  $( '#weighted-value' ).text( voteRatio + voteText );
}

function drawIt( dataset ) {
  var weightKeys = {
    population: 'populationweight',
    eligible: 'eligibleweight',
    votingage: 'votingageweight',
    turnout: 'turnoutweight'
  };
  var weight = weightKeys[dataset];
  $( '#container div.state-box' ).remove();

  var body = d3.select('#container')
  .selectAll('div')
    .data(
      data.sort( function(x, y) {
        return d3.descending( x[weight], y[weight] )
      } )
    ).enter()
    .append('div')
      .attr('class',
        function(d) { return 'state-box voted-' + d.voted.toLowerCase(); } )
      .style('width', function(d) { return ( d[weight] * 200 ) + "px" } )
      .style('height', function(d) { return Math.max((d[weight] * 10), 20) + 'px'} )
         .style('background-color', function(d) {return 'rgb(' + (d[weight] * 50) + ',0,0)'} )
         .style('font-size', function(d) { return Math.max((d[weight] * 10), 16) + 'px'})
         .html( function(d) {
           var content = '<p class="label"><strong>' + d.state + '</strong></p>';
           content += '<p class="electors hidden">Electors: ' + d.electors + '</p>';
           content += '<p class="population hidden">Population: ' + commaSeparate( d.population ) + '</p>';
           return content;
         } );

    // with data sorted by ratio, make the worst comparison

    $( '#base-state').val( data[0].state );
    $( '#compared-state').val( data[data.length - 1].state );
}

$( document ).ready( function() {

  var url = 'https://spreadsheets.google.com/feeds/list/1Z-xlwrIGdbGBVyZwdXvfvtPqnMl50jvcpX_sffsb8L4/od6/public/basic?alt=json';

  $.ajax({
  dataType: "json",
  url: url,
  success: function( dump ) {
    $( dump.feed.entry ).each( function() {
      var obj = {};
      obj.state = this.title.$t.trim();
      if ( obj.state !== 'Total' ) {
        $.extend( obj, parseText( this.content.$t ) );
        data.push( obj );
      }
    } );

    fillWeights();
    renderTable();
  	drawIt( 'population' );
    compareIt( 'population' );

    $( '#viz-buttons button[data-data_set="population"]' ).attr( 'disabled', true );
    $( '#com-buttons button[data-data_set="population"]' ).attr( 'disabled', true );

  }
  });

  $( '#viz-buttons button' ).click( function() {
    $( '#viz-buttons button' ).attr( 'disabled', false );
    $( this ).attr( 'disabled', true );
    drawIt( $( this ).attr( 'data-data_set' ) );
  } );

  $( '#com-buttons button' ).click( function() {
    $( '#com-buttons button' ).attr( 'disabled', false );
    $( this ).attr( 'disabled', true );
    compareIt( $( this ).attr( 'data-data_set' ) );
  } );

  $( '#comparator' ).change( function() {
    var dataset = $( '#com-buttons button[disabled]').attr( 'data-data_set' );
    compareIt( dataset );
  } );

} );