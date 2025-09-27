import React from 'react'
import {Link} from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="notfound">
      <h2>Not Found</h2>
      <p>The page you requested does not exist.</p>
      <Link to="/">Go Home</Link>
    </div>
  )
}
