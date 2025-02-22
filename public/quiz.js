// quiz.js

document.addEventListener('DOMContentLoaded', function() {
    const quizForm = document.getElementById('ringQuiz');
    if (quizForm) {
      quizForm.addEventListener('submit', function(e) {
        console.log('Quiz submitted');
        // You can add custom validation or animations here if needed.
      });
    }
  });
  