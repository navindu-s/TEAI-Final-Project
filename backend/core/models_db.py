from sqlalchemy import Column, Integer, DateTime, Text
from datetime import datetime
from .database import Base

class WitheringLog(Base):
    __tablename__ = "withering_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_data = Column(Text)
    predicted_output = Column(Text)

class PluckingLog(Base):
    __tablename__ = "plucking_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_data = Column(Text)
    predicted_output = Column(Text)

class ForeignParticleLog(Base):
    __tablename__ = "foreign_particle_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_data = Column(Text)
    predicted_output = Column(Text)

class VisionTasterLog(Base):
    __tablename__ = "vision_taster_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_data = Column(Text)
    predicted_output = Column(Text)

class AuctionPriceLog(Base):
    __tablename__ = "auction_price_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_data = Column(Text)
    predicted_output = Column(Text)
