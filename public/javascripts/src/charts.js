function loadItems(category, year = moment().startOf('year').format('YYYY')) {
  axios.get(`/api/category/${category}?year=${year}`)
    .then(res => {
      const data = res.data;
      console.log(`year: ${2017}`)
      console.log(data['sumByMonth'][year])
      const labels = Object.keys(data['sumByMonth'][year]);
      const values = Object.values(data['sumByMonth'][year])

      const ctx = document.getElementById("myChart");

      const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Amount Spent Per Month',
            data: values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          title: {
            display: true,
            text: `${category.charAt(0).toUpperCase() + category.slice(1)} Spending for ${year}`
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(value, index, values) {
                    return '$' + value;
                }
              }
            }]
          }
        }
      });
    })
  }
  

  
