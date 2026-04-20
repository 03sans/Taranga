from pydantic import BaseModel, EmailStr, field_validator
import re

class UserBase(BaseModel):
    full_name: str
    email: str
    role: str = "teacher"  # default

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        if len(v) > 120:
            raise ValueError("Full name cannot exceed 120 characters.")
        if not re.match(r"^[A-Za-z\s'\-\.]+$", v):
            raise ValueError("Full name can only contain letters, spaces, hyphens, apostrophes, and dots.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"admin", "teacher", "parent", "student"}
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(sorted(allowed))}.")
        return v

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        return v

class UserLogin(BaseModel):
    email: str          # plain str — EmailStr rejects .local domains used internally
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class StudentAccountCreate(BaseModel):
    """Used by a teacher to create login credentials for a student."""
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters.")
        if len(v) > 20:
            raise ValueError("Username cannot exceed 20 characters.")
        if not re.match(r"^[a-z0-9_]+$", v):
            raise ValueError("Username can only contain lowercase letters, numbers, and underscores.")
        return v

    @field_validator("password")
    @classmethod
    def validate_student_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        if len(v) > 64:
            raise ValueError("Password cannot exceed 64 characters.")
        return v


class StudentAccountOut(BaseModel):
    username: str
    student_id: int
    user_id: int
    is_active: bool

    model_config = {"from_attributes": True}
