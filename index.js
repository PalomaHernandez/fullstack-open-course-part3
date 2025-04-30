require('dotenv').config()
const express = require('express')
const app = express()

app.use(express.static('dist'))

const Person = require('./models/person')

var morgan = require('morgan')
morgan.token('body', function (req, res) { return JSON.stringify(req.body) })

app.use(express.json())
app.use(morgan(' :method :url :status :res[content-length] - :response-time ms :body'))

const cors = require('cors')
app.use(cors())


app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
        if(person) {
            response.json(person)
        } else {
            response.status(404).end()
        }
    })
    .catch(error => {
        console.log(error)
        next(error)
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id).then(result => {
        if(!result){
            return response.status(404).json({ error: 'Person not found' })
        }
        response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body
    const person = {
        name: body.name,
        number: body.number,
    }
    Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
        .then(updatedPerson => {
            if(!updatedPerson) {
                return response.status(404).json({ error: 'Person not found' })
            }
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})


app.post('/api/persons', (request,response,next) => {
    const body = request.body
    if(!body.name || !body.number){
        return response.status(400).json({ 
            error: 'name or number missing' 
        })
    }
    const person = new Person({
        name: body.name,
        number:body.number,
    })
    person.save().then(savedPerson => {
        response.json(savedPerson)
    }).catch(error => {
        next(error)
    })
})

app.get('/info', (request, response) => {
    const date = new Date()
    Person.find({}).then(persons => {
        const info = `<p>Phonebook has info for ${persons.length} people</p><p>${date}</p>`
        response.send(info)
    })
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
  }
  
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ReferenceError'){
        return response.status(400).send({ error: 'malformatted id' })
    }
    else if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message)
        return response.status(400).json({ error: messages })
    }
  
    next(error)
}

app.use(errorHandler)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})