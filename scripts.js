var data = [];

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
    rowHtml += '<td class="cell_electors">' + row.electors + '</td>';
    rowHtml += '<td class="cell_population">' + commaSeparate( row.population ) + '</td>';
    rowHtml += '<td class="cell_votingage">' + commaSeparate( row.votingage ) + '</td>';
    rowHtml += '<td class="cell_eligible">' + commaSeparate( row.eligible ) + '</td>';
    rowHtml += '</tr>'
    $( '#tabular tbody' ).append( rowHtml );
  }
}

function drawIt( dataset ) {
  var weightKeys = {
    total: 'voteweight',
    eligible: 'eligibleweight',
    votingage: 'votingageweight'
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
           content += '<p class="population hidden">Population: ' + d.population + '</p>';
           return content;
         } );
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
  	drawIt( 'total' );
    $( '#buttons button[data-data_set="total"]' ).attr( 'disabled', true );

    renderTable();
  }
  });

  $( '#buttons button' ).click( function() {
    $( '#buttons button' ).attr( 'disabled', false );
    $( this ).attr( 'disabled', true );
    drawIt( $( this ).attr( 'data-data_set' ) );
  } );

} );